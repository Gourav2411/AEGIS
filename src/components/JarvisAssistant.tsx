import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, BrainCircuit, Volume2, Mic, MicOff, Loader2 } from 'lucide-react';
import { chatWithJarvis, generateSpeech } from '../services/geminiService';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export default function JarvisAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Aegis Assistant online. How can I assist with your drug discovery process today?' }
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

  const handleSend = async () => {
    if (!input.trim() || isLoading || isLiveMode) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const responseText = await chatWithJarvis(userMsg.text, useDeepThink, useDeepSearch, history);
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
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
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
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-cyan-950 border border-neon-cyan text-neon-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:bg-neon-cyan hover:text-jarvis-bg transition-all z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] glass-panel border border-neon-cyan/50 rounded-xl flex flex-col z-50 overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.15)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-cyan-950/50">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-neon-cyan" />
                <span className="font-mono text-neon-cyan font-bold tracking-widest uppercase text-sm">Aegis Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-cyan-500 hover:text-neon-cyan transition-colors">
                <X className="w-5 h-5" />
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
