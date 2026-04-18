import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Loader2, Square, Activity, Radio,
  Zap, Brain, Shield, Settings, Volume2
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from '../types';
import { translations } from '../translations';
import { createPCM16Blob, decodeAudioData } from '../utils';

interface LiveViewProps {
  lang: Language;
}

export const LiveView: React.FC<LiveViewProps> = ({ lang }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [rms, setRms] = useState(0);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // Auto-scroll transcript
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  const stopLive = useCallback(async () => {
    setIsActive(false);
    setIsConnecting(false);
    setIsMuted(false);

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    processorRef.current?.disconnect();
    processorRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    if (audioContextRef.current?.state !== 'closed') {
      try {
        await audioContextRef.current?.close();
      } catch (e) {
        console.warn('AudioContext close error:', e);
      }
    }
    audioContextRef.current = null;
  }, []);

  const startLive = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setTranscript(['System: Synchronizing with IMPERIUM Neural Link...']);

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error('API Key missing. Please check your settings.');

      const ai = new GoogleGenAI({ apiKey });

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are IMPERIUM Intelligence. Use a professional, calm, and authoritative voice. You are a world-class consultant expert in strategy, finance, and technology. Your intelligence is superior, smart, professional, and powerful. Every response must be deeply insightful and of the highest quality.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            setTranscript(prev => [...prev.slice(-10), 'System: Secure quantum link established.']);
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              const audioData = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binary = atob(audioData);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

              if (audioContextRef.current) {
                const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContextRef.current.destination);
                source.start();
              }
            }

            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              const text = message.serverContent.modelTurn.parts[0].text;
              setTranscript(prev => [...prev.slice(-20), `IMPERIUM: ${text}`]);
            }

            if (message.serverContent?.interrupted) {
              // Interruption logic could go here
              console.log('Interrupted');
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setError('Neural link unstable. Recalibrating...');
            stopLive();
          },
          onclose: () => {
            setTranscript(prev => [...prev, 'System: Uplink terminated.']);
            stopLive();
          }
        }
      });

      sessionRef.current = session;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current || isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        setRms(Math.sqrt(sum / inputData.length));

        const pcmData = createPCM16Blob(inputData);
        sessionRef.current.sendRealtimeInput({
          audio: {
            data: pcmData.data,
            mimeType: pcmData.mimeType
          }
        });
      };

      source.connect(processor);
      processor.connect(ctx.destination);

    } catch (err: any) {
      console.error('Live setup fail:', err);
      setError(err.message || 'Quantum initialization failed.');
      setIsConnecting(false);
      stopLive();
      
      if (err.message?.includes('404')) {
        setError('Model still initializing. Please wait a moment and try again.');
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-gradient-to-b from-amber-600/10 via-amber-500/5 to-transparent blur-3xl opacity-50" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-amber-900/20 bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2 rounded-xl border transition-all duration-500 ${isActive ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
              <Radio className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
            </div>
            {isActive && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-ping" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-200 font-['Cinzel'] tracking-widest">{t.live?.title || 'Neural Stream'}</h2>
            <div className="flex items-center gap-2">
               <span className={`text-[9px] uppercase font-bold tracking-tighter ${isActive ? 'text-green-500' : 'text-zinc-600'}`}>
                {isActive ? '● Established' : '○ Standby'}
               </span>
               <span className="text-[9px] text-zinc-700 font-mono">LATENCY: {isActive ? '24ms' : '--'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {isActive && (
             <div className="flex items-center gap-4 mr-4">
               <div className="text-[10px] text-zinc-500 font-mono hidden md:block">ENCRYPTION: 256-BIT AES</div>
               <div className="flex items-center gap-1">
                 {[1,2,3,4].map(i => (
                   <div
                    key={i}
                    className="w-1 bg-amber-500 rounded-full transition-all duration-100"
                    style={{ height: `${isActive ? 4 + Math.random() * 16 : 4}px` }}
                   />
                 ))}
               </div>
             </div>
           )}
           <button
            onClick={() => {}}
            className="p-2 text-zinc-600 hover:text-amber-400 hover:bg-zinc-900 rounded-xl transition-all border border-transparent hover:border-zinc-800"
           >
             <Settings className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 space-y-12">

        {/* Neural Core Visualization */}
        <div className="relative group cursor-pointer" onClick={isActive ? stopLive : startLive}>
          <div className={`absolute inset-0 bg-amber-500/20 rounded-full blur-[80px] transition-all duration-1000 ${isActive ? 'scale-125 opacity-100' : 'scale-75 opacity-0'}`} />

          <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full border-2 flex items-center justify-center transition-all duration-700 transform ${
            isActive
              ? 'border-amber-500/50 shadow-[0_0_60px_-15px_rgba(245,158,11,0.5)] scale-105'
              : 'border-zinc-800 bg-zinc-900/40 hover:border-amber-500/30'
          }`}>

            {/* Pulsing rings */}
            {isActive && (
              <>
                <div className="absolute inset-4 border border-amber-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                <div className="absolute inset-8 border border-amber-500/10 rounded-full animate-[ping_2s_linear_infinite_0.5s]" />
              </>
            )}

            {/* Floating particles (fake) */}
            {isActive && Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400 rounded-full animate-pulse"
                style={{
                  top: `${50 + 40 * Math.sin(i * Math.PI / 4)}%`,
                  left: `${50 + 40 * Math.cos(i * Math.PI / 4)}%`,
                }}
              />
            ))}

            <div className="flex flex-col items-center gap-3">
              {isConnecting ? (
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
              ) : isActive ? (
                <div className="flex items-end gap-1.5 h-16">
                   {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-amber-500 rounded-full animate-bounce"
                        style={{
                          height: `${10 + (rms * 150 * (0.5 + Math.random() * 0.5))}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.4s'
                        }}
                      />
                   ))}
                </div>
              ) : (
                <Brain className="w-16 h-16 text-zinc-700 group-hover:text-amber-500/50 transition-colors duration-500" />
              )}
              <span className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-amber-400' : 'text-zinc-600'}`}>
                {isConnecting ? 'Initialising' : isActive ? 'Connected' : 'Begin Uplink'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Overlay */}
        <div className={`flex items-center gap-4 transition-all duration-500 ${isActive || isConnecting ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl border transition-all ${
              isMuted
                ? 'bg-red-500/10 border-red-500/50 text-red-500'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={stopLive}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-red-900/20 active:scale-95 flex items-center gap-3"
          >
            <Square className="w-5 h-5 fill-current" />
            {t.live?.end || 'Terminate'}
          </button>

          <button
            onClick={() => {}}
            className="p-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:text-amber-400 hover:border-amber-500/40 transition-all"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        {/* Real-time Subtitles */}
        <div
          ref={containerRef}
          className={`w-full max-w-2xl h-32 overflow-y-auto px-6 space-y-2 text-center transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
          style={{ scrollbarWidth: 'none' }}
        >
          {transcript.map((line, i) => (
            <p
              key={i}
              className={`text-sm tracking-wide ${
                i === transcript.length - 1
                  ? 'text-amber-100 font-medium'
                  : 'text-zinc-600 opacity-50'
              }`}
            >
              {line}
            </p>
          ))}
          {transcript.length === 0 && isActive && (
             <p className="text-zinc-600 italic text-sm animate-pulse">Waiting for IMPERIUM to respond...</p>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div className="relative z-10 px-6 py-3 bg-zinc-900/20 border-t border-amber-900/10 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest">
          <Shield className="w-3 h-3 text-amber-700" /> End-to-End Encryption
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest">
          <Activity className="w-3 h-3 text-amber-700" /> REAL-TIME NEURAL FEED
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-600 uppercase tracking-widest">
          <Zap className="w-3 h-3 text-amber-700" /> LOW-LATENCY TRANSMISSION
        </div>
      </div>

      {/* Full-screen loading/connecting overlay */}
      {isConnecting && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center space-y-6">
           <div className="relative">
              <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <Zap className="w-6 h-6 text-amber-400" />
              </div>
           </div>
           <div className="text-center">
             <h3 className="text-amber-200 font-['Cinzel'] text-xl mb-1 tracking-widest">Neural Syncing</h3>
             <p className="text-zinc-500 text-xs uppercase tracking-[0.3em]">Calibrating Response Node...</p>
           </div>
           <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden">
             <div className="h-full bg-amber-500 animate-[loading_2s_ease-in-out_infinite]" />
           </div>
        </div>
      )}
    </div>
  );
};
