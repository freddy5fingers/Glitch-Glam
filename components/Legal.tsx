
import React from 'react';

interface LegalProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

const Legal: React.FC<LegalProps> = ({ type, onBack }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-black text-white p-6 lg:p-12 animate-slide-up">
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
        <button onClick={onBack} className="self-start mb-8 text-zinc-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          <h1 className="serif text-3xl lg:text-4xl font-bold italic mb-8">
            {type === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
          </h1>
          
          <div className="prose prose-invert prose-sm">
            {type === 'privacy' ? (
              <>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h3>1. Introduction</h3>
                <p>Welcome to Glitch Glam. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application.</p>
                <h3>2. Data We Collect</h3>
                <p>We may collect, use, store and transfer different kinds of personal data about you which includes: Identity Data (username), Contact Data (email), and Technical Data (device info). <strong>Crucially, facial images uploaded for processing are processed in real-time and are not permanently stored on our servers unless explicitly saved by you to your profile.</strong></p>
                <h3>3. How We Use Your Data</h3>
                <p>We will only use your personal data when the law allows us to. Most commonly, we use your personal data to provide the AI makeup try-on service and manage your account.</p>
                <h3>4. Data Security</h3>
                <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way.</p>
              </>
            ) : (
              <>
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <h3>1. Agreement to Terms</h3>
                <p>By accessing our application, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                <h3>2. Use License</h3>
                <p>Permission is granted to temporarily download one copy of the materials (information or software) on Glitch Glam for personal, non-commercial transitory viewing only.</p>
                <h3>3. Disclaimer</h3>
                <p>The AI makeup visualization is for simulation purposes only. Actual results with physical products may vary based on skin type, lighting, and application method.</p>
                <h3>4. User Accounts</h3>
                <p>You are responsible for maintaining the security of your account and password. Glitch Glam cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legal;
