
import React, { useState } from 'react';

interface TutorialProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "INIT_CANVAS",
    subtitle: "Upload or Snap",
    desc: "Start by uploading a high-res portrait or take a selfie. For best AI results, ensure good lighting and a clear view of the face.",
    icon: (
      <svg className="w-12 h-12 text-fuchsia-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  {
    title: "EQUIP_MODS",
    subtitle: "Apply Makeup",
    desc: "Select products from the sidebar. Adjust opacity with the slider. The AI intelligently maps texture to your skin tone.",
    icon: (
      <svg className="w-12 h-12 text-[#39FF14]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  {
    title: "NEURAL_SCAN",
    subtitle: "Scan Reality",
    desc: "Found a lipstick in real life? Click '+ SCAN' to use your camera. We'll identify the product and add it to your digital palette.",
    icon: (
      <svg className="w-12 h-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    )
  },
  {
    title: "SPLIT_REALITY",
    subtitle: "Compare Looks",
    desc: "Use the split-screen toggle to compare your new look against the original or test two different products side-by-side.",
    icon: (
      <svg className="w-12 h-12 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    )
  }
];

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(57,255,20,0.1)]">
        
        {/* Decorative Background Blob */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#39FF14]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-fuchsia-600/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] text-[#39FF14] font-bold tracking-[0.3em] uppercase mb-1">System Onboarding</p>
              <h2 className="text-2xl font-bold italic text-white glow-text">{STEPS[currentStep].title}</h2>
            </div>
            <button 
              onClick={onComplete}
              className="text-zinc-500 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors"
            >
              Skip
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col items-center text-center space-y-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
               {STEPS[currentStep].icon}
            </div>
            <div>
               <h3 className="text-xl font-bold mb-2">{STEPS[currentStep].subtitle}</h3>
               <p className="text-zinc-400 text-sm leading-relaxed">{STEPS[currentStep].desc}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6">
            {/* Dots */}
            <div className="flex justify-center gap-2">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentStep ? 'w-8 bg-[#39FF14] shadow-[0_0_10px_rgba(57,255,20,0.5)]' : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button 
              onClick={handleNext}
              className="w-full py-4 rounded-full bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#39FF14] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {currentStep === STEPS.length - 1 ? 'Enter Studio' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
