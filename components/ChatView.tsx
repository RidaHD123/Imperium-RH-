
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Language } from '../types';
import { Send, Bot, User, Loader2, Globe, Sparkles } from 'lucide-react';
import { translations } from '../translations';

interface ChatViewProps {
  lang: Language;
}

export const ChatView: React.FC<ChatViewProps> = ({ lang }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const tools = useSearch ? [{ googleSearch: {} }] : [];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: input,
        config: {
          tools: tools,
          systemInstruction: t.chat.systemInstruction
        }
      });

      const text = response.text || t.chat.noResponse;
      
      // Extract grounding sources
      const sources: { uri: string; title: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) {
            sources.push({ uri: chunk.web.uri, title: chunk.web.title });
          }
        });
      }

      setMessages(prev => [...prev, { role: 'model', text, sources }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: t.chat.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-amber-500/20 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur-md p-4 border-b border-amber-500/20 flex justify-between items-center">
        <h2 className="text-lg font-medium text-amber-100 flex items-center gap-3 font-['Cinzel']">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-gold-shiny tracking-wide">{t.chat.role}</span>
        </h2>
        <button
          onClick={() => setUseSearch(!useSearch)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 transition-all border ${
            useSearch 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
              : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-600'
          }`}
        >
          <Globe className="w-3 h-3" />
          {useSearch ? t.chat.searchActive : t.chat.offline}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-700">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 flex items-center justify-center mb-6 shadow-inner">
                <Bot className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-gold-shiny text-xl font-['Cinzel'] mb-2">{t.chat.welcomeTitle}</h3>
            <p className="text-zinc-500 font-light text-sm">{t.chat.welcomeText}</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-amber-500/30 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot className="w-6 h-6 text-amber-500" />
              </div>
            )}
            <div className={`max-w-[80%] space-y-2`}>
              <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-lg border ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-800 text-white border-transparent rounded-br-none' 
                  : 'bg-zinc-900/80 text-zinc-200 border-zinc-800 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 pl-2">
                  {msg.sources.map((source, sIdx) => (
                    <a 
                      key={sIdx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-wider bg-black/40 border border-amber-900/40 text-amber-500 px-3 py-1 rounded hover:bg-amber-900/20 transition-colors truncate max-w-[200px]"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 border-2 border-amber-500">
                <User className="w-6 h-6 text-amber-800" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-900 border border-amber-500/30 flex items-center justify-center">
               <Bot className="w-6 h-6 text-amber-500" />
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-2xl rounded-tl-none border border-amber-500/10 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-xs text-amber-500/70 animate-pulse">{t.chat.processing}</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-amber-900/20 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chat.placeholder}
            className="flex-1 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-zinc-200 placeholder-zinc-600 shadow-inner transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-4 bg-gold-shiny text-black rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] transform hover:scale-105"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
