import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Server, Key, Fingerprint, CheckCircle, RefreshCw } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface LoginScreenProps {
  onLogin: (role: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSSO = async (provider: string) => {
    setIsAuthenticating(true);
    try {
      const response = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Store the token in localStorage to simulate a real session
        localStorage.setItem('aegis_enterprise_token', data.token);
        localStorage.setItem('aegis_user_profile', JSON.stringify(data.user));
        
        // Make it a real Firebase session so Firestore rules work
        const userCred = await signInAnonymously(auth);
        
        // Save enterprise profile to Firestore
        await setDoc(doc(db, 'users', userCred.user.uid), {
          userId: userCred.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          role: data.user.role,
          professionCategory: 'Industry',
          enterpriseId: data.user.enterpriseId,
          provider: data.user.provider,
          createdAt: new Date(),
          updatedAt: new Date()
        }, { merge: true });
        
        onLogin(data.user.role);
      } else {
        throw new Error('SSO failed');
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // Fallback for demo if backend is unreachable
      onLogin('Lead Scientist');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 font-mono relative overflow-hidden">
      {/* Background Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#083344_1px,transparent_1px),linear-gradient(to_bottom,#083344_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-8 shadow-2xl shadow-cyan-900/20 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cyan-950 border border-cyan-800 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <Shield className="w-8 h-8 text-neon-cyan" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">AEGIS<span className="text-neon-cyan">2035</span></h1>
          <p className="text-xs text-cyan-500/70 uppercase tracking-widest mt-2">Enterprise Operating System</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handleSSO('Okta')}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {isAuthenticating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            Continue with Okta SSO
          </button>
          
          <button 
            onClick={() => handleSSO('Azure')}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 bg-[#0078D4] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#006cbd] transition-colors disabled:opacity-50"
          >
            {isAuthenticating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
            Continue with Azure AD
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-2 text-slate-500 uppercase tracking-widest">Or use Biometrics</span>
            </div>
          </div>

          <button 
            onClick={() => handleSSO('Biometric')}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 font-bold py-3 px-4 rounded-lg hover:bg-cyan-900/50 transition-colors disabled:opacity-50"
          >
            <Fingerprint className="w-5 h-5" />
            Authenticate via YubiKey
          </button>

          <button 
            onClick={async () => {
              setIsAuthenticating(true);
              try {
                const userCred = await signInAnonymously(auth);
                await setDoc(doc(db, 'users', userCred.user.uid), {
                  userId: userCred.user.uid,
                  email: 'admin@aegis.local',
                  displayName: 'System Admin',
                  role: 'admin',
                  professionCategory: 'System',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }, { merge: true });
                onLogin('System Administrator');
              } catch (e) {
                console.error(e);
                onLogin('System Administrator');
              } finally {
                setIsAuthenticating(false);
              }
            }}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 bg-red-950/30 border border-red-900/50 text-red-400 font-bold py-3 px-4 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50 mt-4"
          >
            <Shield className="w-5 h-5" />
            Admin Bypass (Test Mode)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-500/70">
            <CheckCircle className="w-4 h-4" /> SOC 2 Type II Certified
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-500/70">
            <CheckCircle className="w-4 h-4" /> HIPAA Compliant Environment
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-500/70">
            <CheckCircle className="w-4 h-4" /> End-to-End VPC Encryption
          </div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-4 text-xs text-slate-600 uppercase tracking-widest">
        Aegis Therapeutics © 2035 | Private Air-Gapped Instance
      </div>
    </div>
  );
}
