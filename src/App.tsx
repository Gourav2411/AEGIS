import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Beaker, Dna, Package, ShieldAlert, Cpu, Database, Network, LogOut, User as UserIcon, BrainCircuit, Shield } from 'lucide-react';
import { generateFormulation, simulateTrial, generatePackaging, FormulationResult, TrialResult, PackagingResult, TrialParams, setGeminiApiKey } from './services/geminiService';
import InputPanel from './components/InputPanel';
import FormulationPanel from './components/FormulationPanel';
import PhysicsSimulationPanel from './components/PhysicsSimulationPanel';
import TrialPanel from './components/TrialPanel';
import TrialInputPanel from './components/TrialInputPanel';
import PackagingPanel from './components/PackagingPanel';
import Visualizer from './components/Visualizer';
import JarvisAssistant from './components/JarvisAssistant';
import Login from './components/Login';
import LoginScreen from './components/LoginScreen';
import ProfilePage from './components/ProfilePage';
import SlmStudio from './components/SlmStudio';
import EnterpriseHub from './components/EnterpriseHub';
import AdminDashboard from './components/AdminDashboard';
import LiveOptimization from './components/LiveOptimization';
import { auth, db, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { logAuditAction, sanitizePHI } from './lib/compliance';

export type Step = 'input' | 'formulation' | 'physics' | 'trial-input' | 'trial' | 'packaging';

export interface FormData {
  disease: string;
  cureRequired: string;
  category: string;
  receptors: string;
  agenticMode?: boolean;
  useBioNeMo?: boolean;
  pdbFile?: File | null;
  optimizationParams?: {
    toxicity: number;
    solubility: number;
    affinity: number;
  };
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [asyncError, setAsyncError] = useState<Error | null>(null);
  const [currentView, setCurrentView] = useState<'app' | 'profile' | 'slm-studio' | 'admin' | 'enterprise'>('app');
  const [useSlm, setUseSlm] = useState(false);
  const [enterpriseRole, setEnterpriseRole] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(() => {
    return localStorage.getItem('gemini_api_key') === 'AI_STUDIO_ADMIN';
  });

  const [step, setStep] = useState<Step>('input');
  const handleSetStep = async (newStep: Step) => {
    setStep(newStep);
    await saveStateToFirestore({ step: newStep });
  };
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    disease: '',
    cureRequired: '',
    category: 'Small Molecule',
    receptors: ''
  });

  const [formulationResult, setFormulationResult] = useState<FormulationResult | null>(null);
  const [qsarData, setQsarData] = useState<any>(null);
  const [dockingData, setDockingData] = useState<any>(null);
  const [trialResult, setTrialResult] = useState<TrialResult | null>(null);
  const [trialParams, setTrialParams] = useState<TrialParams | null>(null);
  const [packagingResult, setPackagingResult] = useState<PackagingResult | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [hasDeployedSlm, setHasDeployedSlm] = useState(false);
  const [slmContext, setSlmContext] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScientist, setIsScientist] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  if (asyncError) {
    throw asyncError;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && authReady) {
      // Fetch user profile for role
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        let role = 'user';
        if (docSnap.exists()) {
          role = docSnap.data().role || 'user';
        }
        
        // Override for specific admin email or enterprise role
        if (user.email === 'gourav.k.24@gmail.com' || enterpriseRole === 'System Administrator') {
          role = 'admin';
        } else if (enterpriseRole === 'Lead Scientist' && role === 'user') {
          role = 'scientist';
        }
        
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsScientist(role === 'scientist' || role === 'admin');
      });

      // Fetch project state
      const docRef = doc(db, 'projects', user.uid);
      const unsubscribeProject = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.step) setStep(data.step as Step);
          if (data.formData) setFormData(JSON.parse(data.formData));
          if (data.formulationResult) setFormulationResult(JSON.parse(data.formulationResult));
          if (data.trialParams) setTrialParams(JSON.parse(data.trialParams));
          if (data.trialResult) setTrialResult(JSON.parse(data.trialResult));
          if (data.packagingResult) setPackagingResult(JSON.parse(data.packagingResult));
          if (data.qsarData) setQsarData(JSON.parse(data.qsarData));
          if (data.dockingData) setDockingData(JSON.parse(data.dockingData));
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `projects/${user.uid}`);
        } catch (e: any) {
          setAsyncError(e);
        }
      });

      // Fetch SLM status
      const modelRef = doc(db, 'models', 'global_slm');
      const unsubscribeModel = onSnapshot(modelRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHasDeployedSlm(data.status === 'deployed');
          setSlmContext(data.trainingContext || '');
          if (data.status !== 'deployed') {
            setUseSlm(false);
          }
        }
      });

      return () => {
        unsubscribeUser();
        unsubscribeProject();
        unsubscribeModel();
      };
    }
  }, [user, authReady, enterpriseRole]);

  const saveStateToFirestore = async (updates: any) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'projects', user.uid);
      const docSnap = await getDoc(docRef);
      const now = new Date();
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          userId: user.uid,
          createdAt: now,
          updatedAt: now,
          ...updates
        });
      } else {
        await setDoc(docRef, {
          updatedAt: now,
          ...updates
        }, { merge: true });
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, `projects/${user?.uid}`);
      } catch (e: any) {
        setAsyncError(e);
      }
    }
  };

  const handleLogin = () => {
    // Handled by onAuthStateChanged
  };

  const handleLogout = async () => {
    await logout();
    resetSystem();
  };

  const handleGenerateFormulation = async (data: FormData) => {
    // Sanitize PHI from inputs before processing
    const sanitizedData = {
      ...data,
      disease: sanitizePHI(data.disease),
      cureRequired: sanitizePHI(data.cureRequired),
      receptors: sanitizePHI(data.receptors)
    };

    setFormData(sanitizedData);
    setLoading(true);
    
    // Log the audit action
    await logAuditAction('DRUG_DISCOVERY_INITIATED', {
      disease: sanitizedData.disease,
      category: sanitizedData.category,
      agenticMode: sanitizedData.agenticMode,
      useSlm: useSlm
    });

    let interval: NodeJS.Timeout | null = null;
    
    if (data.agenticMode) {
      const messages = [
        'Initializing Agentic Loop Optimization...',
        'Generating 10,000 initial molecular candidates...',
        'Running high-throughput in-silico screening...',
        'Selecting top 1% (100 candidates) for mutation...',
        'Applying quantum-mechanical toxicity reduction...',
        'Re-simulating binding affinities...',
        'Finalizing mathematically perfect molecule...'
      ];
      let i = 0;
      setLoadingText(messages[0]);
      interval = setInterval(() => {
        i++;
        if (i < messages.length) {
          setLoadingText(messages[i]);
        }
      }, 1500);
    } else {
      setLoadingText('Synthesizing novel molecular structures...');
    }

    try {
      let pdbFileContent: string | undefined = undefined;
      if (sanitizedData.pdbFile) {
        pdbFileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(sanitizedData.pdbFile!);
        });
      }

      const result = await generateFormulation(sanitizedData.disease, sanitizedData.cureRequired, sanitizedData.category, sanitizedData.receptors, sanitizedData.agenticMode, useSlm, pdbFileContent, sanitizedData.useBioNeMo, slmContext);
      if (interval) clearInterval(interval);
      setFormulationResult(result);
      setStep('formulation');
      await saveStateToFirestore({
        formData: JSON.stringify(sanitizedData),
        formulationResult: JSON.stringify(result),
        step: 'formulation'
      });
    } catch (error: any) {
      if (interval) clearInterval(interval);
      console.error("Formulation error:", error);
      alert(error.message || "An error occurred during formulation generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTrial = async (params: TrialParams) => {
    if (!formulationResult) return;
    
    // Log the audit action
    await logAuditAction('TRIAL_SIMULATION_INITIATED', {
      compoundName: formulationResult.name,
      params: params,
      useSlm: useSlm
    });

    setTrialParams(params);
    setLoading(true);
    setLoadingText('Running in-silico and in-vitro simulations...');
    try {
      const result = await simulateTrial(formulationResult.name, formulationResult.mechanismOfAction, params, csvData || undefined, useSlm, slmContext);
      setTrialResult(result);
      setStep('trial');
      await saveStateToFirestore({
        trialParams: JSON.stringify(params),
        trialResult: JSON.stringify(result),
        step: 'trial'
      });
    } catch (error: any) {
      console.error("Trial error:", error);
      alert(error.message || "An error occurred during trial simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePackaging = async () => {
    if (!formulationResult) return;

    // Log the audit action
    await logAuditAction('PACKAGING_GENERATION_INITIATED', {
      compoundName: formulationResult.name,
      category: formData.category
    });

    setLoading(true);
    setLoadingText('Designing supply chain and packaging protocols...');
    try {
      const result = await generatePackaging(formulationResult.name, formData.category);
      setPackagingResult(result);
      setStep('packaging');
      await saveStateToFirestore({
        packagingResult: JSON.stringify(result),
        step: 'packaging'
      });
    } catch (error: any) {
      console.error("Packaging error:", error);
      alert(error.message || "An error occurred during packaging generation.");
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = async () => {
    setStep('input');
    setFormulationResult(null);
    setQsarData(null);
    setDockingData(null);
    setTrialResult(null);
    setPackagingResult(null);
    setFormData({ disease: '', cureRequired: '', category: 'Small Molecule', receptors: '' });
    
    if (user) {
      await saveStateToFirestore({
        step: 'input',
        formData: null,
        formulationResult: null,
        qsarData: null,
        dockingData: null,
        trialParams: null,
        trialResult: null,
        packagingResult: null
      });
    }
  };

  if (!authReady) {
    return <div className="min-h-screen bg-jarvis-bg flex items-center justify-center font-mono text-neon-cyan">Loading...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!enterpriseRole) {
    return <LoginScreen onLogin={(role) => setEnterpriseRole(role)} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-8">
      {/* FDA RUO Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-500 text-[10px] md:text-xs font-mono text-center py-1 z-50 flex items-center justify-center gap-2 uppercase tracking-widest backdrop-blur-sm">
        <ShieldAlert className="w-3 h-3" />
        For Research Use Only (RUO). Not for use in diagnostic procedures. Not FDA cleared or approved.
      </div>

      <div className="scanline"></div>
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Header */}
      <header className="relative z-10 glass-panel border-b border-t-0 border-x-0 border-jarvis-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Cpu className="text-neon-cyan w-8 h-8" />
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest neon-text-cyan uppercase">Aegis</h1>
            <p className="text-xs font-mono text-cyan-500/70 tracking-widest uppercase">AI Drug Discovery Command Center</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 font-mono text-xs text-cyan-500/70">
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded ${
            userRole === 'admin' ? 'bg-purple-900/10 border-purple-500/30 text-purple-400' :
            userRole === 'scientist' ? 'bg-blue-900/10 border-blue-500/30 text-blue-400' :
            'bg-cyan-900/10 border-cyan-500/30 text-cyan-400'
          }`}>
            <span>ROLE: {userRole.toUpperCase()}</span>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/10 border border-cyan-500/30 rounded">
              <span className="text-cyan-400">ADMIN MODE</span>
              <button 
                onClick={() => {
                  if (adminMode) {
                    const key = prompt("Enter your Gemini API Key:");
                    if (key) {
                      setGeminiApiKey(key);
                      setAdminMode(false);
                    }
                  } else {
                    setGeminiApiKey('AI_STUDIO_ADMIN');
                    setAdminMode(true);
                  }
                }}
                className={`w-8 h-4 rounded-full relative transition-colors ${adminMode ? 'bg-cyan-500' : 'bg-cyan-900/50'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${adminMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
          {hasDeployedSlm && currentView === 'app' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/10 border border-purple-500/30 rounded">
              <span className="text-purple-400">AEGIS-SLM</span>
              <button 
                onClick={() => setUseSlm(!useSlm)}
                className={`w-8 h-4 rounded-full relative transition-colors ${useSlm ? 'bg-purple-500' : 'bg-cyan-900/50'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useSlm ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>SYS.ONLINE</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span>NEURAL.LINK: ACTIVE</span>
          </div>
          {isAdmin && (
            <>
              <button 
                onClick={() => setCurrentView(currentView === 'admin' ? 'app' : 'admin')}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-colors ${currentView === 'admin' ? 'bg-amber-900/20 border-amber-500 text-amber-400' : 'border-cyan-900/50 hover:bg-cyan-900/30 hover:text-cyan-300'}`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">{currentView === 'admin' ? 'BACK TO APP' : 'ADMIN PANEL'}</span>
              </button>
            </>
          )}
          {isScientist && (
            <>
              <button 
                onClick={() => setCurrentView(currentView === 'slm-studio' ? 'app' : 'slm-studio')}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-colors ${currentView === 'slm-studio' ? 'bg-purple-900/20 border-purple-500 text-purple-400' : 'border-cyan-900/50 hover:bg-cyan-900/30 hover:text-cyan-300'}`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span className="hidden sm:inline">{currentView === 'slm-studio' ? 'BACK TO APP' : 'SLM STUDIO'}</span>
              </button>
            </>
          )}
          {isAdmin && (
            <>
              <button 
                onClick={() => setCurrentView(currentView === 'enterprise' ? 'app' : 'enterprise')}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-colors ${currentView === 'enterprise' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'border-cyan-900/50 hover:bg-cyan-900/30 hover:text-cyan-300'}`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">{currentView === 'enterprise' ? 'BACK TO APP' : 'ENTERPRISE HUB'}</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setCurrentView(currentView === 'app' ? 'profile' : 'app')}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded transition-colors ${currentView === 'profile' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-cyan-900/50 hover:bg-cyan-900/30 hover:text-cyan-300'}`}
          >
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{currentView === 'app' ? 'PROFILE' : 'BACK TO APP'}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 border border-cyan-900/50 rounded hover:bg-cyan-900/30 hover:text-cyan-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">LOGOUT</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6">
        
        {currentView === 'profile' ? (
          <div className="w-full h-full glass-panel rounded-xl p-6 overflow-y-auto">
            <ProfilePage onBack={() => setCurrentView('app')} />
          </div>
        ) : currentView === 'slm-studio' ? (
          <div className="w-full h-full glass-panel rounded-xl p-6 overflow-y-auto">
            <SlmStudio onBack={() => setCurrentView('app')} />
          </div>
        ) : currentView === 'enterprise' ? (
          <div className="w-full h-full glass-panel rounded-xl p-6 overflow-y-auto">
            <EnterpriseHub />
          </div>
        ) : currentView === 'admin' ? (
          <div className="w-full h-full glass-panel rounded-xl p-6 overflow-y-auto">
            <AdminDashboard onBack={() => setCurrentView('app')} />
          </div>
        ) : (
          <>
            {/* Left Panel - Visualizer */}
            <div className="w-full lg:w-1/3 h-full flex flex-col gap-6">
          <div className="glass-panel flex-1 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <Visualizer step={step} loading={loading} trialResult={trialResult} formulationResult={formulationResult} pdbFile={formData?.pdbFile} receptors={formData?.receptors} />
            
            {/* Status Overlay */}
            <div className="absolute bottom-4 left-4 right-4 font-mono text-xs">
              <div className="flex justify-between text-cyan-500/70 mb-1">
                <span>SYSTEM STATUS</span>
                <span>{loading ? 'PROCESSING' : 'IDLE'}</span>
              </div>
              <div className="h-1 bg-jarvis-bg rounded overflow-hidden">
                <motion.div 
                  className="h-full bg-neon-cyan"
                  initial={{ width: "0%" }}
                  animate={{ width: loading ? "100%" : "0%" }}
                  transition={{ duration: 2, repeat: loading ? Infinity : 0 }}
                />
              </div>
              {loading && <p className="mt-2 text-center text-neon-cyan animate-pulse">{loadingText}</p>}
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="glass-panel rounded-xl p-4 flex justify-between items-center font-mono text-xs">
             {[
               { id: 'input', icon: Dna, label: 'DISCOVERY' },
               { id: 'formulation', icon: Beaker, label: 'SYNTHESIS' },
               { id: 'trial-input', icon: Activity, label: 'TRIAL PREP' },
               { id: 'trial', icon: ShieldAlert, label: 'SIMULATION' },
               { id: 'packaging', icon: Package, label: 'LOGISTICS' }
             ].map((s, i) => (
               <div key={s.id} className={`flex flex-col items-center gap-2 ${step === s.id ? 'text-neon-cyan' : 'text-cyan-500/40'}`}>
                 <div className={`p-2 rounded-full ${step === s.id ? 'neon-border bg-cyan-900/30' : 'border border-cyan-900/30'}`}>
                   <s.icon className="w-4 h-4" />
                 </div>
                 <span className="hidden sm:block">{s.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Right Panel - Dynamic Content */}
        <div className="w-full lg:w-2/3 h-full glass-panel rounded-xl p-6 overflow-y-auto">
          {step === 'input' && (
            <InputPanel onSubmit={handleGenerateFormulation} loading={loading} />
          )}
          
          {step === 'formulation' && formulationResult && (
            <FormulationPanel 
              result={formulationResult} 
              onNext={() => handleSetStep('physics')} 
              onReset={resetSystem}
              loading={loading} 
              formData={formData}
              useSlm={useSlm}
            />
          )}

          {step === 'physics' && formulationResult && (
            <PhysicsSimulationPanel
              formulation={formulationResult}
              receptor={formData?.receptors || ''}
              onNext={() => handleSetStep('trial-input')}
              onReset={resetSystem}
              onOptimize={() => {
                if (formData) {
                  handleGenerateFormulation({ ...formData, agenticMode: true });
                }
              }}
              loading={loading}
              onQsarData={(data) => {
                setQsarData(data);
                saveStateToFirestore({ qsarData: JSON.stringify(data) });
              }}
              onDockingData={(data) => {
                setDockingData(data);
                saveStateToFirestore({ dockingData: JSON.stringify(data) });
              }}
            />
          )}

          {step === 'trial-input' && formulationResult && (
            <TrialInputPanel
              formulation={formulationResult}
              disease={formData.disease}
              onSimulate={handleSimulateTrial}
              onReset={resetSystem}
              loading={loading}
              csvData={csvData}
              setCsvData={setCsvData}
            />
          )}

          {step === 'trial' && trialResult && (
            <TrialPanel 
              result={trialResult} 
              formulation={formulationResult}
              formData={formData}
              trialParams={trialParams}
              qsarData={qsarData}
              dockingData={dockingData}
              onNext={handleGeneratePackaging} 
              onReset={resetSystem}
              loading={loading} 
              useSlm={useSlm}
            />
          )}

          {step === 'packaging' && packagingResult && (
            <PackagingPanel 
              result={packagingResult} 
              formulation={formulationResult}
              trialParams={trialParams}
              trialResult={trialResult}
              formData={formData}
              qsarData={qsarData}
              dockingData={dockingData}
              onReset={resetSystem} 
            />
          )}
        </div>
        </>
        )}
      </main>

      {/* Jarvis Assistant Overlay */}
      {currentView === 'app' && (
        <JarvisAssistant 
          appState={{ step, formData, formulationResult, trialParams, trialResult, packagingResult }}
          onUpdateFormData={setFormData}
          onGenerateFormulation={handleGenerateFormulation}
          onSimulateTrial={handleSimulateTrial}
          onGeneratePackaging={handleGeneratePackaging}
          onReset={resetSystem}
          onSetStep={handleSetStep}
        />
      )}
    </div>
  );
}
