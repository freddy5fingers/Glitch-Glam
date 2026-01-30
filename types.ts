
export enum MakeupCategory {
  LIPSTICK = 'Lipstick',
  BLUSH = 'Blush',
  EYESHADOW = 'Eyeshadow',
  EYELINER = 'Eyeliner',
  FOUNDATION = 'Foundation'
}

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: {
    skinTone?: string;
  };
  favorites?: string[];
  customProducts?: Product[];
  savedLooks?: SavedLook[];
}

export interface Product {
  id: string;
  brand: string;
  category: MakeupCategory;
  name: string;
  color: string;
  hex: string;
  finish: 'Matte' | 'Glossy' | 'Shimmer' | 'Satin' | 'Natural' | 'Dewy';
  description: string;
  isCustom?: boolean; // Flag for user-scanned products
  imagePath?: string; // Path to secure image in storage
}

export interface HistorySnapshot {
  processedImage: string | null;
  comparisonImage: string | null;
  selectedProduct: Product | null;
  comparisonProduct: Product | null;
}

export interface SavedLook {
  id: string;
  name: string;
  date: number;
  thumbnail: string; // Base64 of the final look
  products: {
    primary: Product | null;
    comparison: Product | null;
  };
  intensity: number;
}

export interface TryOnState {
  originalImage: string | null;
  processedImage: string | null;
  comparisonImage: string | null; // For the Split Screen feature
  selectedProduct: Product | null;
  comparisonProduct: Product | null;
  targetDescription: string | null; // "The woman on the left"
  isComparisonMode: boolean;
  isProcessing: boolean;
  isDetectingSkin: boolean;
  isScanning: boolean;
  error: string | null;
  favorites: string[];
  groundingLinks: GroundingLink[];
  history: HistorySnapshot[];
  historyIndex: number;
  recommendedProducts: Record<string, string>; // Category -> ProductID
  customProducts: Product[]; // User-scanned library
  savedLooks: SavedLook[]; // User-named looks
}
