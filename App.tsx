
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TryOnState, MakeupCategory, Product, GroundingLink, HistorySnapshot, SavedLook, User } from './types';
import { PRODUCTS, COLOR_SPECTRUM, CATEGORIES } from './constants';
import { applyMakeup, scanProductDetails, getBeautyRecommendations, applyRecommendedLook, detectFaces } from './services/geminiService';
import { authService } from './services/authService';
import { userService } from './services/userService';
import { storageService } from './services/storageService'; // Import Storage Service
import Camera from './components/Camera';
import ProductCard from './components/ProductCard';
import Auth from './components/Auth';
import Legal from './components/Legal';
import Tutorial from './components/Tutorial';

// Helper for color matching
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

const getColorDistance = (hex1: string, hex2: string) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  return Math.sqrt(
    Math.pow(rgb2.r - rgb1.r, 2) +
    Math.pow(rgb2.g - rgb1.g, 2) +
    Math.pow(rgb2.b - rgb1.b, 2)
  );
}

// Helper to create small thumbnail for saving
const createThumbnail = (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 400; // Slightly larger for better quality
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 80% quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Image); // Fallback
      }
    };
    img.onerror = () => resolve(base64Image);
  });
};

const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<'auth' | 'studio' | 'privacy' | 'terms'>('auth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  // App State
  const [state, setState] = useState<TryOnState>(() => {
    try {
      const savedFavs = localStorage.getItem('glow_v8_favs');
      const savedCustom = localStorage.getItem('glow_v8_custom_products');
      const savedLooks = localStorage.getItem('glow_v8_saved_looks');
      
      return {
        originalImage: null,
        processedImage: null,
        comparisonImage: null,
        selectedProduct: null,
        comparisonProduct: null,
        targetDescription: null,
        isComparisonMode: false,
        isProcessing: false,
        isDetectingSkin: false,
        isScanning: false,
        error: null,
        favorites: savedFavs ? JSON.parse(savedFavs) : [],
        groundingLinks: [],
        history: [],
        historyIndex: -1,
        recommendedProducts: {},
        customProducts: savedCustom ? JSON.parse(savedCustom) : [],
        savedLooks: savedLooks ? JSON.parse(savedLooks) : [],
      };
    } catch (e) {
      return {
        originalImage: null,
        processedImage: null,
        comparisonImage: null,
        selectedProduct: null,
        comparisonProduct: null,
        targetDescription: null,
        isComparisonMode: false,
        isProcessing: false,
        isDetectingSkin: false,
        isScanning: false,
        error: null,
        favorites: [],
        groundingLinks: [],
        history: [],
        historyIndex: -1,
        recommendedProducts: {},
        customProducts: [],
        savedLooks: [],
      };
    }
  });

  const [activeTab, setActiveTab] = useState<MakeupCategory | 'Research' | 'Favorites' | 'My Looks'>(MakeupCategory.LIPSTICK);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'selfie' | 'scan'>('selfie');
  const [sliderPos, setSliderPos] = useState(50);
  const [intensity, setIntensity] = useState(80);
  const [showSaveLookModal, setShowSaveLookModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFaceSelectModal, setShowFaceSelectModal] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<string[]>([]);
  const [tempUploadedImage, setTempUploadedImage] = useState<string | null>(null);
  const [newLookName, setNewLookName] = useState('');
  
  // Securely resolved image URLs for private user content
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Auth and Tutorial Status on Mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView('studio');
      
      const seenTutorial = localStorage.getItem('glow_v8_tutorial_seen');
      if (!seenTutorial) {
        setShowTutorial(true);
      }
    }
  }, []);

  // Sync with Supabase when user is logged in
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (currentUser?.id) {
      userService.getUserData(currentUser.id).then(userData => {
        if (userData) {
          setState(prev => ({
            ...prev,
            favorites: userData.favorites || prev.favorites,
            customProducts: userData.customProducts || prev.customProducts,
            savedLooks: userData.savedLooks || prev.savedLooks
          }));
        }
      });

      unsubscribe = userService.subscribe(currentUser.id, (updatedUser) => {
        setState(prev => ({
          ...prev,
          favorites: updatedUser.favorites || prev.favorites,
          customProducts: updatedUser.customProducts || prev.customProducts,
          savedLooks: updatedUser.savedLooks || prev.savedLooks
        }));
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.id]);

  // Secure Image Resolution Effect
  // Fetches signed URLs for all saved looks and scanned products whenever the lists change
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const newUrls: Record<string, string> = { ...signedUrls };
      let hasUpdates = false;

      const resolveUrl = async (id: string, path?: string) => {
          // If no path, or it's base64/http (legacy), skip signing (unless we want to verify freshness)
          if (!path || path.startsWith('data:') || path.startsWith('http')) {
              if (path && !newUrls[id]) {
                  newUrls[id] = path;
                  hasUpdates = true;
              }
              return;
          }
          
          if (!newUrls[id]) {
              const url = await storageService.getSignedUrl(path);
              if (url) {
                  newUrls[id] = url;
                  hasUpdates = true;
              }
          }
      };

      // Process Saved Looks
      for (const look of state.savedLooks) {
        await resolveUrl(look.id, look.thumbnail);
      }

      // Process Scanned Products
      for (const prod of state.customProducts) {
          if (prod.imagePath) {
              await resolveUrl(prod.id, prod.imagePath);
          }
      }
      
      if (hasUpdates) setSignedUrls(newUrls);
    };

    if (state.savedLooks.length > 0 || state.customProducts.length > 0) {
        fetchSignedUrls();
    }
  }, [state.savedLooks, state.customProducts]);

  // Persist to LocalStorage with Safety Checks
  useEffect(() => {
    try {
      localStorage.setItem('glow_v8_favs', JSON.stringify(state.favorites));
    } catch (e) { console.warn("Storage quota exceeded for favorites"); }
  }, [state.favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('glow_v8_custom_products', JSON.stringify(state.customProducts));
    } catch (e) { console.warn("Storage quota exceeded for custom products"); }
  }, [state.customProducts]);

  useEffect(() => {
    try {
      localStorage.setItem('glow_v8_saved_looks', JSON.stringify(state.savedLooks));
    } catch (e) { console.warn("Storage quota exceeded for saved looks"); }
  }, [state.savedLooks]);

  // DB Persistence Helper
  const syncToDb = (updates: Partial<User>) => {
    if (currentUser?.id) {
      userService.updateUserData(currentUser.id, updates);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setCurrentView('auth');
    setState(prev => ({ ...prev, originalImage: null, processedImage: null }));
  };

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('glow_v8_tutorial_seen', 'true');
  };

  const handleUndo = () => {
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];
      setState(prev => ({
        ...prev,
        historyIndex: newIndex,
        processedImage: snapshot.processedImage,
        comparisonImage: snapshot.comparisonImage,
        selectedProduct: snapshot.selectedProduct,
        comparisonProduct: snapshot.comparisonProduct
      }));
    }
  };

  const handleRedo = () => {
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];
      setState(prev => ({
        ...prev,
        historyIndex: newIndex,
        processedImage: snapshot.processedImage,
        comparisonImage: snapshot.comparisonImage,
        selectedProduct: snapshot.selectedProduct,
        comparisonProduct: snapshot.comparisonProduct
      }));
    }
  };

  const triggerScan = async (image: string) => {
    setState(prev => ({ ...prev, isScanning: true, error: null }));
    try {
      const { product, links } = await scanProductDetails(image);
      
      // Upload Scanned Image Securely if User is Logged In
      if (currentUser?.id) {
          const scanId = product.id;
          const thumb = await createThumbnail(image); // Compress
          const uploadResult = await storageService.uploadImage(currentUser.id, thumb, scanId);
          
          if (uploadResult) {
              product.imagePath = uploadResult.path;
              // Immediately update signed URLs cache
              setSignedUrls(prev => ({ ...prev, [scanId]: uploadResult.signedUrl }));
          }
      }

      setState(prev => {
        const nextState = {
            ...prev,
            isScanning: false,
            customProducts: [product, ...prev.customProducts],
            groundingLinks: links,
            activeTab: 'Research' as const,
            selectedProduct: product
        };
        syncToDb({ customProducts: nextState.customProducts });
        return nextState;
      });
    } catch (e) {
      setState(prev => ({ ...prev, isScanning: false, error: "Product scan failed. Ensure clear lighting." }));
    }
  };

  const triggerAutoEnhance = async () => {
    if (!state.originalImage) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const faces = await detectFaces(state.originalImage);
      const target = faces.length > 0 ? faces[0] : "The person";
      await initializeBeautyProfile(state.originalImage, target);
    } catch (err) {
       setState(prev => ({ ...prev, isProcessing: false, error: "Auto-enhance failed." }));
    }
  };

  const initializeBeautyProfile = async (image: string, targetDesc: string) => {
    try {
      const analysis = await getBeautyRecommendations(image);
      const baseLook = await applyRecommendedLook(image, analysis);
      
      setState(prev => ({
        ...prev,
        processedImage: baseLook,
        targetDescription: targetDesc,
        isProcessing: false,
        history: [...prev.history, {
          processedImage: baseLook,
          comparisonImage: prev.processedImage || prev.originalImage,
          selectedProduct: null,
          comparisonProduct: null
        }],
        historyIndex: prev.historyIndex + 1
      }));
    } catch (e) {
      setState(prev => ({ 
        ...prev, 
        processedImage: image, 
        targetDescription: targetDesc,
        isProcessing: false, 
        error: "Could not complete beauty analysis. You can still apply products manually." 
      }));
    }
  };

  const processNewImage = async (image: string) => {
    setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null, 
        originalImage: image,
        processedImage: image,
        history: [{
            processedImage: image,
            comparisonImage: null,
            selectedProduct: null,
            comparisonProduct: null
        }],
        historyIndex: 0
    }));

    try {
      const faces = await detectFaces(image);
      if (faces.length > 1) {
        setTempUploadedImage(image);
        setDetectedFaces(faces);
        setShowFaceSelectModal(true);
        setState(prev => ({ ...prev, isProcessing: false }));
      } else {
        setState(prev => ({ 
            ...prev, 
            isProcessing: false,
            targetDescription: faces[0] || "The person"
        }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, error: "Face detection failed.", isProcessing: false }));
    }
  };
  
  const handleNewPhoto = () => {
    if (window.confirm("Start over with a new photo? Unsaved changes will be lost.")) {
        // Clear input logic is critical here
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        setState(prev => ({
            ...prev,
            originalImage: null,
            processedImage: null,
            comparisonImage: null,
            selectedProduct: null,
            comparisonProduct: null,
            history: [],
            historyIndex: -1,
            targetDescription: null,
            isComparisonMode: false,
            error: null,
            isProcessing: false,
            isScanning: false, 
            groundingLinks: [] 
        }));
        setSliderPos(50);
        setTempUploadedImage(null);
        setDetectedFaces([]);
    }
  };

  const handleCapture = (image: string) => {
    if (cameraMode === 'scan') {
      triggerScan(image);
    } else {
      processNewImage(image);
    }
    setShowCamera(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        processNewImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductSelect = async (product: Product, customIntensity?: number) => {
    if (!state.originalImage) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    // Use provided intensity or current state intensity
    const appliedIntensity = customIntensity || intensity;
    if (customIntensity) setIntensity(customIntensity);

    try {
      const baseImage = state.isComparisonMode && state.comparisonImage ? state.comparisonImage : (state.processedImage || state.originalImage);
      const result = await applyMakeup(baseImage, product, appliedIntensity, state.targetDescription);

      const newHistoryItem: HistorySnapshot = {
        processedImage: result,
        comparisonImage: state.processedImage,
        selectedProduct: product,
        comparisonProduct: state.selectedProduct
      };

      const newHistory = [...state.history.slice(0, state.historyIndex + 1), newHistoryItem];

      setState(prev => ({
        ...prev,
        processedImage: result,
        selectedProduct: product,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isProcessing: false
      }));
    } catch (e) {
      setState(prev => ({ ...prev, isProcessing: false, error: "Failed to apply product." }));
    }
  };

  const handleFaceSelect = (face: string) => {
    if (tempUploadedImage) {
      setShowFaceSelectModal(false);
      setState(prev => ({ 
          ...prev, 
          originalImage: tempUploadedImage,
          processedImage: tempUploadedImage,
          targetDescription: face,
          isProcessing: false
      }));
    }
  };
  
  const handleSaveLook = async () => {
    if (!currentUser) {
        setState(prev => ({...prev, error: "You must be logged in to save looks."}));
        return;
    }
    if (!newLookName.trim()) return;
    
    setIsSaving(true);
    
    try {
        let thumbBase64 = '';
        if (state.processedImage) {
            try {
                thumbBase64 = await createThumbnail(state.processedImage);
            } catch (e) {
                console.warn("Thumbnail generation failed, using full image");
                thumbBase64 = state.processedImage;
            }
        }

        const lookId = `look-${Date.now()}`;
        
        // Upload image to Supabase Storage - Returns Path and Temporary Signed URL
        const uploadResult = await storageService.uploadImage(currentUser.id, thumbBase64, lookId);
        
        if (!uploadResult) {
            throw new Error("Failed to upload image. Please check connection.");
        }
        
        const { path, signedUrl } = uploadResult;
        
        // Create new saved look object with Storage Path (Private)
        const newLook: SavedLook = {
          id: lookId,
          name: newLookName,
          date: Date.now(),
          thumbnail: path, // We store the path, not the URL, so it remains secure
          products: {
            primary: state.selectedProduct,
            comparison: state.comparisonProduct
          },
          intensity: intensity
        };
        
        // Optimistic Update
        const updatedLooks = [newLook, ...state.savedLooks];
        
        // Update Local Signed URLs state so the user sees the image immediately
        setSignedUrls(prev => ({ ...prev, [lookId]: signedUrl }));

        setState(prev => ({ ...prev, savedLooks: updatedLooks }));
        
        // Sync to Database
        syncToDb({ savedLooks: updatedLooks });
        
        setShowSaveLookModal(false);
        setNewLookName('');
    } catch (e) {
        console.error("Save look error:", e);
        setState(prev => ({...prev, error: "Could not save look. Check your connection."}));
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDeleteLook = (lookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedLooks = state.savedLooks.filter(l => l.id !== lookId);
    setState(prev => ({ ...prev, savedLooks: updatedLooks }));
    syncToDb({ savedLooks: updatedLooks });
  };
  
  const handleApplySavedLook = (look: SavedLook) => {
     if (look.products.primary) {
         handleProductSelect(look.products.primary, look.intensity);
     }
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setState(prev => {
      const newFavs = prev.favorites.includes(id) 
        ? prev.favorites.filter(fid => fid !== id) 
        : [...prev.favorites, id];
      syncToDb({ favorites: newFavs });
      return { ...prev, favorites: newFavs };
    });
  };

  const displayedProducts = useMemo(() => {
    if (activeTab === 'Favorites') {
      return [...PRODUCTS, ...state.customProducts].filter(p => state.favorites.includes(p.id));
    }
    if (activeTab === 'Research') {
      return state.customProducts;
    }
    // My Looks is handled separately in render
    if (activeTab === 'My Looks') return [];
    return PRODUCTS.filter(p => p.category === activeTab);
  }, [activeTab, state.favorites, state.customProducts]);

  if (currentView === 'auth') {
    return (
      <Auth 
        onLoginSuccess={(user) => { 
          setCurrentUser(user); 
          setCurrentView('studio'); 
          const seenTutorial = localStorage.getItem('glow_v8_tutorial_seen');
          if (!seenTutorial) setShowTutorial(true);
        }} 
      />
    );
  }

  if (currentView === 'privacy' || currentView === 'terms') {
    return <Legal type={currentView} onBack={() => setCurrentView('studio')} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black/90 text-white relative">
      {/* Ambient Background Effects - Fuchsia & Neon Green */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-[#39FF14]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <header className="flex items-center justify-between p-6 border-b border-white/5 z-20 bg-black/40 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-fuchsia-600 to-[#39FF14] rounded-full animate-pulse shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
          <h1 className="text-2xl font-bold tracking-tighter italic glow-text-green">GLITCH GLAM</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-zinc-400 hidden md:block tracking-wider">WELCOME, {currentUser?.name?.toUpperCase()}</span>
          <button onClick={handleLogout} className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-[#39FF14] transition-colors">Logout</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        {/* Main Stage */}
        <div className="flex-1 relative bg-zinc-900/50 flex flex-col items-center justify-start p-4 min-h-[50vh]">
          {!state.originalImage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in relative z-10 w-full">
              <div className="relative inline-block group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-40 h-40 rounded-full border border-dashed border-white/20 flex items-center justify-center group-hover:border-[#39FF14] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all duration-300 bg-black/20 hover:bg-[#39FF14]/10">
                    <svg className="w-12 h-12 text-zinc-500 group-hover:text-[#39FF14] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
                 <p className="mt-6 text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-500 group-hover:text-white transition-colors">Upload Portrait</p>
              </div>
              
              <div className="flex items-center justify-center gap-4 opacity-50">
                  <div className="h-[1px] w-12 bg-white/20"></div>
                  <span className="text-zinc-500 text-[10px] font-bold">OR</span>
                  <div className="h-[1px] w-12 bg-white/20"></div>
              </div>

              <button 
                onClick={() => { setCameraMode('selfie'); setShowCamera(true); }}
                className="bg-white text-black px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#39FF14] hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(57,255,20,0.6)]"
              >
                Open Camera
              </button>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col items-center">
               <div className="relative shadow-2xl rounded-2xl overflow-hidden w-full h-auto border border-white/5 ring-1 ring-white/10 bg-black group">
                 {/* Processing Overlay */}
                 {state.isProcessing && (
                   <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
                     <div className="flex flex-col items-center">
                        <div className="animate-spin w-16 h-16 border-4 border-[#39FF14] border-t-transparent rounded-full mb-4 shadow-[0_0_30px_rgba(57,255,20,0.4)]" />
                        <p className="text-xs font-bold uppercase tracking-widest text-[#39FF14] animate-pulse">
                            {state.isScanning ? "Identifying & Searching Web..." : "Rendering..."}
                        </p>
                     </div>
                   </div>
                 )}
                 
                 {/* New Photo Button (Floating Top Left) */}
                 {!state.isProcessing && (
                     <button 
                        onClick={handleNewPhoto}
                        className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                        New Photo
                     </button>
                 )}
                 
                 {/* AI Auto-Enhance Button (Floating) */}
                 {!state.isProcessing && (
                     <button 
                        onClick={triggerAutoEnhance}
                        className="absolute top-4 right-4 z-40 bg-black/60 backdrop-blur-md border border-[#39FF14] text-[#39FF14] px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-[#39FF14] hover:text-black transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                     >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        AI Auto-Enhance
                     </button>
                 )}

                 {/* Base Image (Result) */}
                 <img 
                   src={state.processedImage || state.originalImage} 
                   alt="Try-on result" 
                   className="w-full h-auto object-contain"
                 />
                 
                 {/* Before/After Comparison Overlay */}
                 {state.isComparisonMode && (
                    <>
                        <div 
                            className="absolute inset-0 overflow-hidden border-r-2 border-[#39FF14] shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-black"
                            style={{ width: `${sliderPos}%` }}
                        >
                            <img 
                              src={state.comparisonImage || state.originalImage || ''} 
                              alt="Original" 
                              className="w-full h-auto object-contain min-w-full h-full"
                              style={{ width: '100vw', maxWidth: '100%' }} // Ensure it scales correctly inside clipped div
                            />
                        </div>
                        
                        {/* Interactive Slider Input */}
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sliderPos}
                            onChange={(e) => setSliderPos(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                        />
                        
                        {/* Slider Handle Visual */}
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-[#39FF14] rounded-full z-20 flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.8)] pointer-events-none"
                            style={{ left: `calc(${sliderPos}% - 16px)` }}
                        >
                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
                        </div>
                    </>
                 )}
               </div>
               
               {/* Controls Overlay */}
               <div className="mt-6 flex flex-wrap gap-4 bg-black/60 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl justify-center">
                  <button onClick={handleUndo} disabled={state.historyIndex <= 0} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                  </button>
                  <button 
                    onClick={() => setState(prev => ({ 
                        ...prev, 
                        isComparisonMode: !prev.isComparisonMode,
                        comparisonImage: !prev.isComparisonMode && !prev.comparisonImage ? prev.originalImage : prev.comparisonImage 
                    }))} 
                    className={`px-6 h-12 flex items-center justify-center rounded-full transition-all gap-2 text-[10px] font-bold uppercase tracking-wider ${state.isComparisonMode ? 'bg-[#39FF14] text-black shadow-[0_0_15px_rgba(57,255,20,0.5)]' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                  >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                     {state.isComparisonMode ? 'Exit Split' : 'Compare'}
                  </button>
                  
                  {/* SAVE LOOK BUTTON */}
                  <button 
                    onClick={() => setShowSaveLookModal(true)}
                    disabled={!state.selectedProduct}
                    className="px-6 h-12 flex items-center justify-center rounded-full transition-all gap-2 text-[10px] font-bold uppercase tracking-wider bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-30 disabled:bg-white/5 shadow-[0_0_15px_rgba(192,38,211,0.3)]"
                  >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                     Save Look
                  </button>

                  <button onClick={handleRedo} disabled={state.historyIndex >= state.history.length - 1} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/></svg>
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96 flex-shrink-0 bg-black/80 backdrop-blur-xl border-l border-white/10 flex flex-col z-10 md:sticky md:top-0 md:h-screen">
          {/* Intensity Control */}
          <div className="p-8 border-b border-white/5">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-400 mb-4 font-bold">
              <span>Opacity</span>
              <span className="text-white">{intensity}%</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="100" 
              value={intensity} 
              onChange={(e) => setIntensity(Number(e.target.value))} 
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#39FF14] hover:accent-[#39FF14]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto p-4 gap-3 scrollbar-hide border-b border-white/5">
             <button 
               onClick={() => { setCameraMode('scan'); setShowCamera(true); }}
               className="flex-shrink-0 px-5 py-2.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/50 text-[#39FF14] text-[10px] font-bold uppercase tracking-wider hover:bg-[#39FF14] hover:text-black transition-all shadow-[0_0_10px_rgba(57,255,20,0.1)]"
             >
                + Scan
             </button>
             {['Research', 'Favorites', 'My Looks', ...CATEGORIES].map(cat => (
               <button
                 key={cat}
                 onClick={() => setActiveTab(cat as any)}
                 className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                   activeTab === cat 
                     ? 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-[0_0_15px_rgba(192,38,211,0.3)]' 
                     : 'bg-transparent text-zinc-500 border-transparent hover:text-white hover:bg-white/5'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>
          
          {/* Research Sources Links */}
          {activeTab === 'Research' && state.groundingLinks.length > 0 && (
              <div className="px-4 pt-4 pb-2 border-b border-white/5">
                <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Verified Web Sources</h4>
                <div className="flex flex-col gap-1.5">
                    {state.groundingLinks.slice(0, 3).map((link, i) => (
                        <a 
                            key={i} 
                            href={link.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#39FF14]/80 hover:text-[#39FF14] hover:underline truncate block transition-colors"
                        >
                            • {link.title}
                        </a>
                    ))}
                </div>
              </div>
          )}

          {/* Product/Looks Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar h-96 md:h-auto">
            {activeTab === 'My Looks' ? (
                // RENDER SAVED LOOKS
                state.savedLooks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4 min-h-[200px]">
                        <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center">
                           <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold">No saved looks</span>
                    </div>
                ) : (
                    state.savedLooks.map(look => (
                        <div 
                            key={look.id}
                            onClick={() => handleApplySavedLook(look)}
                            className="group cursor-pointer p-3 rounded-[2rem] border border-white/5 bg-zinc-900/40 hover:border-[#39FF14]/50 flex items-center gap-4 relative overflow-hidden transition-all"
                        >
                            {/* Look Thumbnail - Now using Signed URL */}
                            <div className="h-16 w-16 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-black">
                                <img 
                                    src={signedUrls[look.id] || look.thumbnail} 
                                    className="w-full h-full object-cover" 
                                    alt={look.name}
                                    onError={(e) => {
                                        // Fallback placeholder
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }} 
                                />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate leading-tight uppercase tracking-tight text-white group-hover:text-[#39FF14] transition-colors">{look.name}</h4>
                                <p className="text-[10px] text-zinc-500">Intensity: {look.intensity}%</p>
                                <p className="text-[8px] text-zinc-600 truncate mt-1">
                                    {look.products.primary?.brand} {look.products.primary?.name}
                                </p>
                            </div>
                            
                            <button 
                                onClick={(e) => handleDeleteLook(look.id, e)}
                                className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))
                )
            ) : (
                // RENDER PRODUCTS
                displayedProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4 min-h-[200px]">
                        <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center">
                           <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4"/></svg>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold">No products found</span>
                    </div>
                ) : (
                    displayedProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isSelected={state.selectedProduct?.id === product.id}
                            isComparisonSelected={state.comparisonProduct?.id === product.id}
                            isFavorite={state.favorites.includes(product.id)}
                            imageUrl={signedUrls[product.id]} 
                            onClick={() => handleProductSelect(product)}
                            onToggleFavorite={(e) => toggleFavorite(e, product.id)}
                        />
                    ))
                )
            )}
          </div>
        </div>
      </main>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {/* Save Look Modal */}
      {showSaveLookModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative">
                <h3 className="text-xl font-bold mb-2 text-white glow-text">Save This Look</h3>
                <p className="text-zinc-500 text-xs mb-6">Give your current creation a name to save it to your profile.</p>
                
                <input 
                    type="text" 
                    placeholder="e.g. Summer Night Glam"
                    value={newLookName}
                    onChange={(e) => setNewLookName(e.target.value)}
                    disabled={isSaving}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-fuchsia-500 focus:bg-black/80 outline-none text-white placeholder-zinc-700 mb-6 disabled:opacity-50"
                    autoFocus
                />
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowSaveLookModal(false)}
                        disabled={isSaving}
                        className="flex-1 py-3 rounded-full border border-white/10 text-[10px] uppercase tracking-widest font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveLook}
                        disabled={!newLookName.trim() || isSaving}
                        className="flex-1 py-3 rounded-full bg-fuchsia-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-fuchsia-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(192,38,211,0.4)] flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </>
                        ) : 'Save'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modals */}
      {showCamera && (
        <Camera 
            onCapture={handleCapture} 
            onClose={() => setShowCamera(false)} 
        />
      )}
      
      {showFaceSelectModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold mb-6 text-white glow-text-green">Select a Face</h3>
                <div className="space-y-3">
                    {detectedFaces.map((face, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleFaceSelect(face)}
                            className="w-full text-left p-4 rounded-xl bg-black/50 border border-white/10 hover:border-[#39FF14] hover:bg-zinc-800 transition-all text-sm group"
                        >
                            <div className="flex justify-between items-center">
                                <span className="group-hover:text-white text-zinc-300 transition-colors">{face}</span>
                                <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#39FF14] transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </div>
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setShowFaceSelectModal(false)}
                    className="mt-6 w-full py-3 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white font-bold transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
      )}
      
      {/* Hidden File Input - Moved here to ensure it is always mounted and ref remains valid */}
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload} />
    </div>
  );
};

export default App;
