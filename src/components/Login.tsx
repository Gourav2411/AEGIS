import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, ArrowRight, ChevronDown } from 'lucide-react';

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

interface LoginProps {
  onLogin: (apiKey: string, provider: AIProvider) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<AIProvider>('gemini');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && apiKey) {
      onLogin(apiKey, provider);
    }
  };

  const handleAdminTest = () => {
    onLogin('AI_STUDIO_ADMIN', 'gemini');
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-cyan-500/70 uppercase tracking-widest mb-1">Operative Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded pl-10 pr-4 py-2 text-sm text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                placeholder="agent@aegis.sys"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-cyan-500/70 uppercase tracking-widest mb-1">Passcode</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded pl-10 pr-4 py-2 text-sm text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-cyan-900/30">
            <label className="block text-xs font-mono text-cyan-500/70 uppercase tracking-widest mb-1">Neural Engine Provider</label>
            <div className="relative mb-4">
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as AIProvider)}
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded pl-4 pr-10 py-2 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan transition-colors font-mono appearance-none cursor-pointer"
              >
                <option value="gemini" className="bg-jarvis-bg text-cyan-100">Google Gemini</option>
                <option value="openai" className="bg-jarvis-bg text-cyan-100">OpenAI GPT</option>
                <option value="anthropic" className="bg-jarvis-bg text-cyan-100">Anthropic Claude Opus</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50 pointer-events-none" />
            </div>

            <label className="block text-xs font-mono text-cyan-500/70 uppercase tracking-widest mb-1">
              {provider === 'gemini' ? 'Gemini API Key' : provider === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
            </label>
            <p className="text-[10px] text-cyan-500/50 mb-2 leading-tight">Required to activate the neural synthesis engine. Your key is stored locally and never sent to our servers.</p>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
              <input 
                type="password" 
                required
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded pl-10 pr-4 py-2 text-sm text-cyan-100 placeholder-cyan-500/30 focus:outline-none focus:border-neon-cyan transition-colors font-mono"
                placeholder={provider === 'gemini' ? 'AIzaSy...' : provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-6 py-3 bg-cyan-900/30 border border-cyan-700 text-neon-cyan rounded text-sm font-bold tracking-widest uppercase hover:bg-neon-cyan hover:text-jarvis-bg transition-all flex items-center justify-center gap-2 group"
          >
            Initialize System
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleAdminTest}
            className="w-full mt-2 py-2 bg-transparent border border-cyan-900/30 text-cyan-500/70 rounded text-xs font-bold tracking-widest uppercase hover:bg-cyan-900/20 hover:text-cyan-300 transition-all flex items-center justify-center gap-2"
          >
            Test in AI Studio (Admin)
          </button>
        </form>
      </div>
    </div>
  );
}
