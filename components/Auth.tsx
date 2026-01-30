
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await authService.login(email, password);
      } else {
        if (!name) throw new Error("Name is required");
        user = await authService.signUp(email, password, name);
      }
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements - Mixed Fuchsia and Neon Green */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-[#39FF14]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] w-full max-w-sm relative z-10 flex flex-col items-center border-t border-white/20 shadow-2xl">
        <div className="mb-10 relative">
            <div className="absolute inset-0 bg-[#39FF14]/20 blur-xl rounded-full"></div>
            <img 
              src="https://driving-purple-dp4or3jpqg.edgeone.app/GLITCHGLAM_LOGO%20(1)%20(1).png" 
              alt="Glitch Glam" 
              className="w-48 relative z-10 object-contain drop-shadow-[0_0_35px_rgba(57,255,20,0.8)]"
            />
        </div>

        <h2 className="serif text-3xl font-bold italic mb-2 text-white text-center glow-text">
          {isLogin ? 'Welcome Back' : 'Join the Studio'}
        </h2>
        <p className="text-zinc-400 text-[10px] mb-8 uppercase tracking-[0.25em] font-bold text-center">
          {isLogin ? 'Login to continue' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {!isLogin && (
            <div className="group">
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-[#39FF14] focus:shadow-[0_0_15px_rgba(57,255,20,0.2)] focus:bg-black/70 outline-none transition-all duration-300 text-white placeholder-zinc-600 shadow-inner"
              />
            </div>
          )}
          <div className="group">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-[#39FF14] focus:shadow-[0_0_15px_rgba(57,255,20,0.2)] focus:bg-black/70 outline-none transition-all duration-300 text-white placeholder-zinc-600 shadow-inner"
            />
          </div>
          <div className="group">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-[#39FF14] focus:shadow-[0_0_15px_rgba(57,255,20,0.2)] focus:bg-black/70 outline-none transition-all duration-300 text-white placeholder-zinc-600 shadow-inner"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                <p className="text-red-400 text-xs text-center font-medium">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 rounded-full uppercase text-[10px] tracking-[0.2em] hover:bg-[#39FF14] hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] mt-4"
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                </span>
            ) : (isLogin ? 'Enter Studio' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center gap-3 text-xs text-zinc-500">
          <p>{isLogin ? "New to Glitch Glam?" : "Already a member?"}</p>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-white font-bold hover:text-[#39FF14] transition-colors uppercase tracking-wider text-[10px] border-b border-white/20 pb-0.5 hover:border-[#39FF14]"
          >
            {isLogin ? 'Create an account' : 'Log in to existing account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
