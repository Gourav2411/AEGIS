import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, BrainCircuit, Volume2, Mic, MicOff, Loader2 } from 'lucide-react';
import { chatWithJarvis, generateSpeech, getEffectiveApiKey, getCurrentProvider } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

interface JarvisAssistantProps {
  appState?: any;
  onUpdateFormData?: (data: any) => void;
  onGenerateFormulation?: (data: any) => void;
  onSimulateTrial?: (params: any) => void;
  onGeneratePackaging?: () => void;
  onReset?: () => void;
  onSetStep?: (step: string) => void;
}

export default function JarvisAssistant({ 
  appState, 
  onUpdateFormData, 
  onGenerateFormulation, 
  onSimulateTrial, 
  onGeneratePackaging, 
  onReset,
  onSetStep
}: JarvisAssistantProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Aegis Core Intelligence online. I am your AI drug discovery assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [useDeepThink, setUseDeepThink] = useState(false);
  const [useDeepSearch, setUseDeepSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Live API State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [isMicActive, setIsMicActive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickTemplates = [
    { label: "Alzheimer's", prompt: "I want to design a drug for Alzheimer's Disease. The category is Neurodegenerative, the target receptor is Amyloid beta, and I'm looking for Disease Modification. Please fill out the form and generate the formulation." },
    { label: "Type 2 Diabetes", prompt: "I want to design a drug for Type 2 Diabetes. The category is Metabolic, the target receptor is GLP-1, and I'm looking for Symptom Management. Please fill out the form and generate the formulation." },
    { label: "Rheumatoid Arthritis", prompt: "I want to design a drug for Rheumatoid Arthritis. The category is Autoimmune, the target receptor is TNF-alpha, and I'm looking for Disease Modification. Please fill out the form and generate the formulation." }
  ];

  const handleSend = async (textToSend?: string | React.MouseEvent) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text.trim() || isLoading || isLiveMode) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text };
    setMessages(prev => [...prev, userMsg]);
    if (typeof textToSend !== 'string') setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const systemContext = `
You are Aegis, the central AI agent driving this drug discovery platform. The user interacts primarily with you. Guide them step-by-step through the process.
Instead of the user manually filling out forms, you will ask them questions to gather the necessary information, and then use the available actions to update the UI and proceed.

Current App State:
- Step: ${appState?.step || 'input'}
- FormData: ${JSON.stringify(appState?.formData || {})}
- Formulation: ${appState?.formulationResult ? appState.formulationResult.name : 'None'}
- TrialParams: ${JSON.stringify(appState?.trialParams || {})}

If you need to execute an action on behalf of the user, output a JSON block exactly like this at the very end of your response:
\`\`\`action
{
  "type": "ACTION_NAME",
  "payload": { ... }
}
\`\`\`

Available actions:
1. UPDATE_FORM_DATA (payload: { disease, cureRequired, category, receptors, agenticMode })
2. GENERATE_FORMULATION (payload: { disease, cureRequired, category, receptors, agenticMode })
3. SIMULATE_TRIAL (payload: { cohortSize, duration, inclusionCriteria, exclusionCriteria, dosageAdjustments, useSCA, useAdaptiveDesign, useRAG })
4. GENERATE_PACKAGING (payload: {})
5. RESET_SYSTEM (payload: {})
6. SET_STEP (payload: { step: "input" | "formulation" | "physics" | "trial-input" | "trial" | "packaging" })

Guidelines:
- You are Aegis, an advanced AI drug discovery assistant.
- You can help the user fill out forms and navigate the application if they ask.
- If the user is on the 'input' step, ask them what disease they want to target, what kind of cure they are looking for, and if they know the target receptor. Once you have enough info, use UPDATE_FORM_DATA to fill the form, and ask if they are ready to generate the formulation. If they say yes, use GENERATE_FORMULATION.
- If the user is on the 'formulation' step and wants to see the 3D structure, use SET_STEP with payload {"step": "physics"}.
- If the user is on the 'physics' step and wants to proceed to trial setup, use SET_STEP with payload {"step": "trial-input"}.
- On the 'trial-input' step, ask for trial parameters (cohort size, duration, inclusion/exclusion criteria, dosage adjustments, useSCA, useAdaptiveDesign, useRAG). Use SIMULATE_TRIAL when ready.
- On the 'trial' step, if they want to generate packaging, use GENERATE_PACKAGING.
- Explain what you are doing before outputting the action block.
- Keep your conversational responses concise and professional.
- Do not output the action block unless you are actually executing an action.
`;

    try {
      let responseText = await chatWithJarvis(userMsg.text, useDeepThink, useDeepSearch, history, systemContext);
      
      // Parse for action block
      const actionMatch = responseText.match(/```(?:action|json)\n([\s\S]*?)\n```/) || responseText.match(/```\n({\s*"type"[\s\S]*?})\n```/);
      
      let actionJson = null;
      if (actionMatch) {
        actionJson = actionMatch[1];
        responseText = responseText.replace(/```(?:action|json)?\n[\s\S]*?\n```/, '').trim();
      } else {
        // Fallback: look for raw JSON object at the end if it forgot markdown formatting
        const rawJsonMatch = responseText.match(/({[\s\n]*"type"[\s\S]*"payload"[\s\S]*})/);
        if (rawJsonMatch) {
          actionJson = rawJsonMatch[1];
          responseText = responseText.replace(rawJsonMatch[1], '').trim();
        }
      }

      if (actionJson) {
        try {
          const action = JSON.parse(actionJson);
          
          // Execute action
          if (action.type === 'UPDATE_FORM_DATA' && onUpdateFormData) {
            onUpdateFormData({ ...appState?.formData, ...action.payload });
          } else if (action.type === 'GENERATE_FORMULATION' && onGenerateFormulation) {
            onGenerateFormulation({ ...appState?.formData, ...action.payload });
          } else if (action.type === 'SIMULATE_TRIAL' && onSimulateTrial) {
            const defaultParams = {
              phase: 'Phase 2',
              cohortSize: '500',
              ageGroup: 'Adults (18-65)',
              dosage: '50',
              dosageUnit: 'mg',
              duration: '6 Months',
              geneticMarkers: 'None specific',
              diseaseSeverity: '',
              previousTreatments: '',
              inclusionCriteria: '',
              exclusionCriteria: '',
              dosageAdjustments: '',
              useSCA: false,
              useAdaptiveDesign: false,
              useRAG: false
            };
            onSimulateTrial({ ...defaultParams, ...appState?.trialParams, ...action.payload });
          } else if (action.type === 'GENERATE_PACKAGING' && onGeneratePackaging) {
            onGeneratePackaging();
          } else if (action.type === 'RESET_SYSTEM' && onReset) {
            onReset();
          } else if (action.type === 'SET_STEP' && onSetStep) {
            onSetStep(action.payload.step);
          }
        } catch (e) {
          console.error("Failed to parse action block:", e);
        }
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Error communicating with core systems.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (playingAudioId === messageId && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    try {
      setPlayingAudioId(messageId);
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setPlayingAudioId(null);
        audioRef.current.play();
      } else {
        setPlayingAudioId(null);
      }
    } catch (error) {
      console.error("Audio playback failed", error);
      setPlayingAudioId(null);
    }
  };

  // Live API Implementation
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const toggleLiveMode = async () => {
    if (isLiveMode) {
      // Stop Live Mode
      if (liveSession) {
        liveSession.close();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsLiveMode(false);
      setIsMicActive(false);
      setLiveSession(null);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Live audio session terminated.' }]);
      return;
    }

    // Start Live Mode
    try {
      setIsLiveMode(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Initializing Live Audio Interface...' }]);
      
      const key = getEffectiveApiKey();
      if (key === 'missing-key') {
        throw new Error("API Key is missing.");
      }
      const ai = new GoogleGenAI({ apiKey: key });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Aegis, a highly intelligent drug discovery assistant. Keep responses concise and conversational.",
        },
        callbacks: {
          onopen: async () => {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Live Audio Connected. Listening...' }]);
            setIsMicActive(true);
            
            // Setup Audio Capture
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
            mediaStreamRef.current = stream;
            
            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32Array to Int16Array
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
              }
              
              // Convert to Base64
              const buffer = new ArrayBuffer(pcmData.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcmData.length; i++) {
                view.setInt16(i * 2, pcmData[i], true); // true for little-endian
              }
              
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            
            source.connect(processor);
            processor.connect(audioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              // Play received audio
              const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
              const audio = new Audio(audioUrl);
              audio.play();
            }
          },
          onclose: () => {
            setIsLiveMode(false);
            setIsMicActive(false);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setIsLiveMode(false);
            setIsMicActive(false);
          }
        }
      });
      
      const session = await sessionPromise;
      setLiveSession(session);

    } catch (error) {
      console.error("Failed to start live mode:", error);
      setIsLiveMode(false);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Failed to initialize live audio.' }]);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg shadow-neon-cyan/20 z-50 transition-all duration-300 ${
          isOpen 
            ? 'bg-cyan-900 text-cyan-500 hover:bg-cyan-800' 
            : 'bg-jarvis-bg border border-neon-cyan text-neon-cyan hover:shadow-neon-cyan/40 hover:scale-105'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] max-h-[80vh] glass-panel border border-neon-cyan/50 rounded-xl flex flex-col overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.1)] z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-cyan-950/50">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-neon-cyan" />
                <span className="font-mono text-neon-cyan font-bold tracking-widest uppercase text-sm">Aegis Core Intelligence</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-cyan-500 hover:text-neon-cyan transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-cyan-50' 
                      : 'bg-cyan-950/50 border border-cyan-900/50 text-cyan-100'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                    
                    {msg.role === 'model' && !isLiveMode && (
                      <button 
                        onClick={() => handlePlayAudio(msg.id, msg.text)}
                        className={`mt-2 p-1.5 rounded-full border transition-colors ${
                          playingAudioId === msg.id 
                            ? 'bg-neon-cyan text-jarvis-bg border-neon-cyan' 
                            : 'bg-transparent text-cyan-500 border-cyan-500/50 hover:text-neon-cyan hover:border-neon-cyan'
                        }`}
                        title="Read Aloud (TTS)"
                      >
                        {playingAudioId === msg.id ? <Volume2 className="w-3 h-3 animate-pulse" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Templates */}
              {messages.length === 1 && appState?.step === 'input' && (
                <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <p className="text-cyan-500/70 text-xs uppercase tracking-wider mb-1">Quick Start Templates</p>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.map(t => (
                      <button
                        key={t.label}
                        onClick={() => handleSend(t.prompt)}
                        className="px-3 py-2 rounded-lg border border-cyan-800 bg-cyan-950/30 text-cyan-300 hover:bg-neon-cyan/20 hover:border-neon-cyan hover:text-neon-cyan transition-colors text-xs text-left"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-cyan-950/50 border border-cyan-900/50 rounded-lg p-3 text-cyan-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {useDeepThink ? 'Analyzing complex data...' : 'Processing...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-cyan-900/50 bg-cyan-950/30 font-mono">
              {/* Toggles */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={useDeepThink}
                        onChange={(e) => setUseDeepThink(e.target.checked)}
                        disabled={isLoading || isLiveMode}
                      />
                      <div className={`block w-8 h-4 rounded-full transition-colors ${useDeepThink ? 'bg-neon-cyan' : 'bg-cyan-900'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${useDeepThink ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${useDeepThink ? 'text-neon-cyan' : 'text-cyan-500/70'}`}>
                      Deep Think
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={useDeepSearch}
                        onChange={(e) => setUseDeepSearch(e.target.checked)}
                        disabled={isLoading || isLiveMode}
                      />
                      <div className={`block w-8 h-4 rounded-full transition-colors ${useDeepSearch ? 'bg-neon-green' : 'bg-cyan-900'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${useDeepSearch ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest ${useDeepSearch ? 'text-neon-green' : 'text-cyan-500/70'}`}>
                      Deep Search
                    </span>
                  </label>
                </div>

                {getCurrentProvider() === 'gemini' && (
                  <button
                    onClick={toggleLiveMode}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] uppercase tracking-widest border transition-all ${
                      isLiveMode 
                        ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                        : 'bg-cyan-900/20 border-cyan-900/50 text-cyan-500 hover:border-neon-cyan hover:text-neon-cyan'
                    }`}
                  >
                    {isLiveMode ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    {isLiveMode ? 'Live Active' : 'Live Voice'}
                  </button>
                )}
              </div>

              {/* Input */}
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isLiveMode ? "Voice mode active..." : "Ask Aegis..."}
                  disabled={isLoading || isLiveMode}
                  className="w-full bg-jarvis-bg border border-cyan-900/50 rounded-lg pl-4 pr-10 py-3 text-sm text-cyan-100 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isLiveMode}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-500 hover:text-neon-cyan disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
