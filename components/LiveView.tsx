
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Mic, MicOff, Activity, XCircle, Zap } from 'lucide-react';
import { createPCM16Blob, decodeAudioData } from '../utils';
import { Language } from '../types';
import { translations } from '../translations';

interface LiveViewProps {
  lang: Language;
}

export const LiveView: React.FC<LiveViewProps> = ({ lang }) => {
  const t = translations[lang];
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState(t.live.ready);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Update status text when language changes if not active
  useEffect(() => {
    if (!isActive && !error) {
        setStatus(t.live.ready);
    }
  }, [lang, isActive, error, t.live.ready]);

  const stopSession = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }

    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }

    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    
    setIsActive(false);
    setStatus(t.live.closed);
  };

  const startSession = async () => {
    setError(null);
    setStatus(t.live.initializing);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContextRef.current.createGain();
      outputNode.connect(outputAudioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus(t.live.active);
            setIsActive(true);

            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPCM16Blob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    new Uint8Array(atob(base64Audio).split('').map(c => c.charCodeAt(0))),
                    ctx
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNode);
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
             }

             if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
            setStatus(t.live.closed);
            setIsActive(false);
          },
          onerror: (err) => {
            console.error(err);
            setError(t.live.error);
            stopSession();
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: t.live.systemInstruction
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start live session", err);
      setError(t.live.error);
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-black text-white overflow-hidden relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[150px] transition-all duration-1000 ${isActive ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-10 max-w-lg w-full">
        <div className="text-center space-y-3">
             <h2 className="text-4xl font-bold tracking-wider font-['Cinzel'] text-gold-shiny">{t.live.title}</h2>
             <p className={`text-sm uppercase tracking-[0.3em] transition-colors ${isActive ? 'text-amber-400' : 'text-zinc-500'}`}>{status}</p>
             {error && <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/50 px-4 py-2 rounded">{error}</p>}
        </div>

        {/* Visualizer / Status Circle */}
        <div className="relative group">
            <div className={`w-56 h-56 rounded-full border border-amber-900/30 flex items-center justify-center transition-all duration-700 ${
                isActive ? 'bg-amber-950/20 shadow-[0_0_80px_rgba(245,158,11,0.2)] border-amber-500/50' : 'bg-zinc-900/50'
            }`}>
                {isActive ? (
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
                        <Activity className="w-24 h-24 text-gold-shiny animate-pulse relative z-10" />
                    </div>
                ) : (
                    <Zap className="w-20 h-20 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                )}
            </div>
            
            {/* Rotating Rings */}
            {isActive && (
                <>
                    <div className="absolute inset-[-20px] border border-amber-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                    <div className="absolute inset-[-40px] border border-amber-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                </>
            )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
            {!isActive ? (
                <button 
                    onClick={startSession}
                    className="flex items-center gap-3 bg-gold-shiny text-black px-10 py-5 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(180,83,9,0.3)] transition-all transform hover:scale-105 hover:shadow-[0_0_50px_rgba(180,83,9,0.5)]"
                >
                    <Mic className="w-6 h-6" />
                    {t.live.btnConnect}
                </button>
            ) : (
                <button 
                    onClick={stopSession}
                    className="flex items-center gap-3 bg-black border border-red-900/50 text-red-500 px-10 py-5 rounded-full font-bold text-lg hover:bg-red-950/20 transition-all"
                >
                    <MicOff className="w-6 h-6" />
                    {t.live.btnEnd}
                </button>
            )}
        </div>
        
        <div className="flex items-center gap-2 text-zinc-600 text-[10px] uppercase tracking-widest">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`}></div>
            {t.live.secure}
        </div>
      </div>
    </div>
  );
};
