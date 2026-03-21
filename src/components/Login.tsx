import React, { useState } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { loginWithGoogle } from '../firebase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onLogin();
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-jarvis-bg">
      <div className="scanline"></div>
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative z-10 glass-panel p-8 rounded-2xl w-full max-w-md border border-cyan-900/50 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-cyan-950/50 border border-neon-cyan flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Shield className="w-8 h-8 text-neon-cyan" />
          </div>
          <h1 className="text-2xl font-mono font-bold tracking-widest neon-text-cyan uppercase">Aegis</h1>
          <p className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase mt-2 text-center">AI Drug Discovery Command Center<br/>Authentication Required</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded text-sm font-mono">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full group relative px-6 py-3 bg-cyan-950/50 border border-neon-cyan text-neon-cyan text-sm uppercase tracking-widest hover:bg-neon-cyan hover:text-jarvis-bg transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2 font-bold font-mono"
        >
          <div className="absolute inset-0 bg-neon-cyan/20 translate-x-full group-hover:translate-x-0 transition-transform"></div>
          <span className="relative flex items-center gap-2">
            {loading ? 'Authenticating...' : 'Sign in with Google'}
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}
