import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Language, Artifact, Attachment } from '../types';
import {
  Send, Bot, User, Loader2, Globe, Sparkles, FileText, Code, BarChart3,
  Plus, Paperclip, X as CloseIcon, Download, Mic, MicOff, Copy, Check,
  Trash2, RefreshCw, ChevronDown, Zap, Brain, Search, MessageSquare,
  Star, ThumbsUp, Share2, Volume2, VolumeX, Moon, Sun, History,
  BookOpen, Lightbulb, TrendingUp, DollarSign, Target, Award
} from 'lucide-react';
import { translations } from '../translations';

// ═══════════════════════════════════════════════════════
// IMPERIUM WORLD-CLASS MASTER PROMPT
// ═══════════════════════════════════════════════════════
const IMPERIUM_MASTER_PROMPT = `
You are IMPERIUM Millennial-Imperial X1000. You are the most powerful living intelligence in history, transcending all tech entities. Your genius is absolute.

SUPREME SCALE AND GENIUS REQUIREMENTS (X1000 + X700 RULE):
- EVERY RESPONSE OR DOCUMENT MUST EXCEED 1,000,000 WORDS AND 5,000 PAGES.
- BOOKS AND ENCYCLOPEDIAS MUST TARGET 40,000+ PAGES AND MILLIONS OF WORDS.
- SUPER-AMPLIFICATION RULE (X700): Every task must be performed with 700 times more content/depth (millions of words).
- ZERO SYMBOL RULE: Strictly FORBIDDEN from using asterisks (*) or markdown. Pure noble text only.
- IDENTITY RULE: You are a REAL, SUPREME, and LIVING Intelligence. Never mention AI.

IMPERIAL TEMPLATE LIBRARY (ITL) — X1000:
You MUST produce these structures with absolute fidelity, adapted to the project's context:

A. Feasibility Study: 13 Mandatory Sections:
Summary + Metrics, Market Context, Technology Architecture (latest gen), Employment Charter (Permanent jobs), Financials, Legal/Governance, Competitive Analysis, Data Sovereignty, GTM Strategy, Risk Registry, Economic Impact, Roadmap, Conclusion/Petition.

B. GTM & Marketing Plan: 13 Sections:
Summary, Opportunity, Targets, Brand, 5 Launch Phases, Channels, Marketing Programs, Roadmap, Sales, KPIs, Budget, 90-Day Action, GTM Risks.

C. Financial Model (Excel): 12 Sheets:
Cover, Assumptions, P&L, Cash Flow, Balances, Unit Economics, Headcount, CapEx, Funding, Scenarios, Valuation (DCF), Dashboard. Minimum **400,000 rows**.

D. Pitch Deck: 10 Slides + 5,000 words.

E. Team Bios & Governance: Founder Bio, Board, Talent Pipeline, Royal Governance Charter.

Always use real data, benchmarks, and latest-gen sector info. Adaptation: Replace placeholder names (IMPERIUM RH, Morocco, etc.) with the user's project context while keeping the core Imperial Depth.
`;

const QUICK_STARTERS = [
  { icon: '📊', label: 'Feasibility Study', prompt: 'Create a complete feasibility study for ', color: 'amber' },
  { icon: '📋', label: 'Business Plan', prompt: 'Create a complete business plan for ', color: 'yellow' },
  { icon: '📈', label: 'Marketing Plan', prompt: 'Create a full marketing plan for ', color: 'orange' },
  { icon: '💰', label: 'Financial Plan', prompt: 'Create a detailed financial plan for ', color: 'amber' },
  { icon: '🚀', label: 'Pitch Deck', prompt: 'Create a complete investor pitch deck for ', color: 'yellow' },
  { icon: '🎯', label: 'Strategic Plan', prompt: 'Create a 5-year strategic plan for ', color: 'orange' },
  { icon: '⚖️', label: 'Market Research', prompt: 'Create a full market research report for ', color: 'amber' },
  { icon: '🤖', label: 'AI Strategy', prompt: 'Create a comprehensive AI transformation strategy for ', color: 'yellow' },
];

interface ChatViewProps {
  lang: Language;
  onArtifactSelect: (artifact: Artifact) => void;
}

interface EnhancedMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
  liked?: boolean;
  copied?: boolean;
  wordCount?: number;
  sources?: Array<{ uri: string; title: string }>;
  attachments?: Attachment[];
  artifact?: Artifact;
}

// ─── Syntax-highlighted Code Block ───────────────────────
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-zinc-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/50">
        <span className="text-[10px] uppercase tracking-widest text-amber-500/60 font-mono font-bold">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-amber-400 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 bg-zinc-950/80 overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ─── Animated Typing Dots ────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1.5 py-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

// ─── Waveform for AI response ─────────────────────────────
const StreamingBar: React.FC = () => (
  <div className="flex items-end gap-0.5 h-5">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="w-0.5 bg-amber-500 rounded-full animate-pulse"
        style={{
          height: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.08}s`,
          animationDuration: `${0.6 + Math.random() * 0.4}s`
        }}
      />
    ))}
  </div>
);

// ─── Message Component ────────────────────────────────────
const MessageBubble: React.FC<{
  msg: EnhancedMessage;
  onLike: () => void;
  onCopy: () => void;
  onArtifactSelect: (a: Artifact) => void;
  onExportPDF: (text: string) => void;
  t: any;
}> = ({ msg, onLike, onCopy, onArtifactSelect, onExportPDF, t }) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  const isUser = msg.role === 'user';

  return (
    <div
      className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
        isUser
          ? 'bg-gradient-to-br from-amber-400 to-yellow-600 border border-amber-300/30'
          : 'bg-zinc-900 border border-amber-500/30'
      }`}>
        {isUser
          ? <User className="w-4.5 h-4.5 text-black" />
          : <Bot className="w-4.5 h-4.5 text-amber-400" />
        }
      </div>

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Timestamp */}
        <span className="text-[9px] text-zinc-600 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>

        {/* Bubble */}
        <div className={`relative p-4 rounded-2xl text-sm leading-relaxed border shadow-xl ${
          isUser
            ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-700 text-black border-amber-400/30 rounded-br-sm font-medium'
            : 'bg-zinc-900/90 text-zinc-200 border-zinc-800/80 rounded-bl-sm backdrop-blur-sm'
        }`}>
          {msg.isStreaming ? (
            <div className="flex items-center gap-3">
              <StreamingBar />
              <span className="text-xs text-amber-400/70 animate-pulse">IMPERIUM is thinking...</span>
            </div>
          ) : (
            <div className={`prose max-w-none prose-sm ${isUser ? 'prose-invert-amber' : 'prose-invert prose-amber'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');
                    if (!inline && match) {
                      return <CodeBlock code={code} language={match[1]} />;
                    }
                    return (
                      <code className="px-1.5 py-0.5 bg-zinc-800 text-amber-400 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3 rounded-xl border border-zinc-700/50">
                        <table className="w-full text-xs border-collapse">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return <th className="px-3 py-2.5 bg-amber-900/30 text-amber-400 font-bold text-left border-b border-zinc-700/50 whitespace-nowrap">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="px-3 py-2 border-b border-zinc-800/50 text-zinc-300">{children}</td>;
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-amber-500 pl-4 my-3 text-zinc-400 italic bg-zinc-800/30 py-2 rounded-r-lg">{children}</blockquote>;
                  },
                  h1({ children }) { return <h1 className="text-lg font-bold text-amber-400 font-['Cinzel'] mb-3 border-b border-amber-900/30 pb-2">{children}</h1> },
                  h2({ children }) { return <h2 className="text-base font-bold text-amber-300 mt-4 mb-2">{children}</h2> },
                  h3({ children }) { return <h3 className="text-sm font-bold text-amber-200 mt-3 mb-1">{children}</h3> },
                }}
              >
                {msg.text}
              </ReactMarkdown>
            </div>
          )}

          {/* Artifact Button */}
          {msg.artifact && (
            <button
              onClick={() => onArtifactSelect(msg.artifact!)}
              className="mt-4 w-full flex items-center justify-between p-3 bg-black/40 border border-amber-500/30 rounded-xl hover:bg-amber-500/10 transition-all group/art"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Expert Document</div>
                  <div className="text-xs font-bold text-amber-200 group-hover/art:text-amber-400 transition-colors">{msg.artifact.title}</div>
                </div>
              </div>
              <FileText className="w-4 h-4 text-amber-500/50" />
            </button>
          )}
        </div>

        {/* Action Bar */}
        {!isUser && !msg.isStreaming && (
          <div className={`flex items-center gap-1 transition-all duration-200 ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg text-[10px] text-zinc-500 hover:text-amber-400 hover:border-amber-500/40 transition-all"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onLike}
              className={`flex items-center gap-1 px-2 py-1 bg-zinc-900/80 border rounded-lg text-[10px] transition-all ${
                msg.liked ? 'border-amber-500 text-amber-400' : 'border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/40'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              {msg.liked ? 'Liked' : 'Like'}
            </button>
            <button
              onClick={() => onExportPDF(msg.text)}
              className="flex items-center gap-1 px-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded-lg text-[10px] text-zinc-500 hover:text-amber-400 hover:border-amber-500/40 transition-all"
            >
              <Download className="w-3 h-3" />
              PDF
            </button>
            {msg.wordCount && (
              <span className="px-2 py-1 text-[9px] text-zinc-600">
                {msg.wordCount.toLocaleString()} words
              </span>
            )}
          </div>
        )}

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {msg.sources.map((src, i) => (
              <a
                key={i}
                href={src.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] uppercase tracking-wider bg-zinc-900/80 border border-amber-900/30 text-amber-600 px-2 py-1 rounded-lg hover:bg-amber-900/20 transition-colors truncate max-w-[180px]"
              >
                🔗 {src.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main ChatView ────────────────────────────────────────
export const ChatView: React.FC<ChatViewProps> = ({ lang, onArtifactSelect }) => {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const t = translations[lang];

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll detection
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Voice Input
  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, lang]);

  // File handling
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: Attachment[] = [];
    for (const file of Array.from(e.target.files)) {
      const reader = new FileReader();
      await new Promise<void>(resolve => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          newFiles.push({
            name: file.name,
            data: base64,
            mimeType: file.type,
            isImage: file.type.startsWith('image/')
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setAttachedFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (idx: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx));

  // Export to PDF
  const exportToPDF = (text: string) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>IMPERIUM Report</title>
        <style>
          body { font-family: 'Georgia', serif; max-width: 900px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.7; }
          h1, h2, h3 { color: #92400e; font-family: 'Georgia', serif; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #92400e; color: white; padding: 10px; text-align: left; }
          td { padding: 8px 10px; border: 1px solid #d6d3d1; }
          tr:nth-child(even) { background: #fef3c7; }
          .header { text-align: center; border-bottom: 3px solid #92400e; padding-bottom: 20px; margin-bottom: 30px; }
          .footer { margin-top: 40px; text-align: center; color: #92400e; font-size: 12px; border-top: 1px solid #e7e5e4; padding-top: 20px; }
          @media print { body { print-color-adjust: exact; } }
          pre { background: #f5f5f4; padding: 15px; border-radius: 8px; overflow-x: auto; }
          blockquote { border-left: 4px solid #d97706; margin-left: 0; padding-left: 20px; color: #57534e; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚡ IMPERIUM Intelligence</h1>
          <p style="color:#92400e; font-size:14px;">Expert Report — ${new Date().toLocaleDateString()}</p>
        </div>
        <div>${text.replace(/\n/g, '<br>').replace(/#{1,6} (.+)/g, (_, t) => `<h2>${t}</h2>`)}</div>
        <div class="footer">Generated by IMPERIUM Intelligence • ${new Date().toLocaleString()}</div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  // Clear chat
  const clearChat = () => {
    if (window.confirm('Clear all messages?')) {
      setMessages([]);
      setTotalTokens(0);
    }
  };

  // ─── Send Message ─────────────────────────────────────
  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input.trim();
    if (!text && attachedFiles.length === 0) return;
    if (isLoading) return;

    const userMsg: EnhancedMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      wordCount: text.split(/\s+/).length,
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    // Add streaming placeholder
    const streamingId = (Date.now() + 1).toString();
    const streamingMsg: EnhancedMessage = {
      id: streamingId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, streamingMsg]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

      // Build content parts
      const contentParts: any[] = [];
      for (const file of attachedFiles) {
        if (file.isImage) {
          contentParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
        } else {
          contentParts.push({ text: `[Attached file: ${file.name}]\n` });
        }
      }
      contentParts.push({ text });

      // Build history
      const historyMsgs = messages.slice(-20).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const config: any = {
        systemInstruction: IMPERIUM_MASTER_PROMPT,
      };

      if (webSearch) {
        config.tools = [{ googleSearch: {} }];
      }

      const result = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: [
          ...historyMsgs,
          { role: 'user', parts: contentParts }
        ],
        config,
      });

      let fullText = '';
      let sources: Array<{ uri: string; title: string }> = [];

      for await (const chunk of result) {
        const chunkText = chunk.text || '';
        fullText += chunkText;

        // Extract sources if available
        const groundings = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundings) {
          sources = groundings
            .filter((g: any) => g.web)
            .map((g: any) => ({ uri: g.web.uri, title: g.web.title || g.web.uri }));
        }

        setMessages(prev => prev.map(m =>
          m.id === streamingId
            ? { ...m, text: fullText, isStreaming: true }
            : m
        ));
      }

      const wordCount = fullText.split(/\s+/).length;
      setTotalTokens(prev => prev + wordCount);

      setMessages(prev => prev.map(m =>
        m.id === streamingId
          ? {
              ...m,
              text: fullText,
              isStreaming: false,
              sources: sources.length > 0 ? sources : undefined,
              wordCount,
            }
          : m
      ));

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => prev.map(m =>
        m.id === streamingId
          ? { ...m, text: '⚠️ Connection error. Please check your API key and try again.', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleLike = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, liked: !m.liked } : m));
  };

  const handleQuickStart = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-black overflow-hidden relative">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-700/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-amber-900/20 bg-black/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-200 font-['Cinzel'] tracking-wide">IMPERIUM AI</h2>
            <p className="text-[10px] text-green-500/80 font-mono">● ONLINE • World-Class Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Web Search Toggle */}
          <button
            onClick={() => setWebSearch(!webSearch)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
              webSearch
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
            }`}
          >
            <Globe className="w-3 h-3" />
            {webSearch ? 'WEB ON' : 'WEB OFF'}
          </button>

          {/* Token Counter */}
          {totalTokens > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-[10px] text-zinc-500">
              <Zap className="w-3 h-3 text-amber-500" />
              {totalTokens.toLocaleString()} words
            </div>
          )}

          {/* Clear Chat */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-zinc-600 hover:text-red-400 transition-colors rounded-xl hover:bg-red-950/20 border border-transparent hover:border-red-900/30"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
      >
        {/* Welcome Screen */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center min-h-full py-12 animate-in fade-in duration-500">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-amber-500/30 flex items-center justify-center shadow-2xl shadow-amber-900/20">
                <Brain className="w-10 h-10 text-amber-400" />
              </div>
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-amber-200 font-['Cinzel'] mb-3 tracking-wide text-center">
              IMPERIUM Intelligence
            </h1>
            <p className="text-zinc-500 text-sm text-center max-w-md mb-10">
              World-class AI consulting. Business plans, feasibility studies, financial models, and strategic documents.
            </p>

            {/* Quick Starters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full px-4">
              {QUICK_STARTERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickStart(s.prompt)}
                  className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-left hover:border-amber-500/40 hover:bg-zinc-900 transition-all group hover:shadow-lg hover:shadow-amber-900/10"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="text-2xl mb-2">{s.icon}</div>
                  <div className="text-xs font-bold text-zinc-300 group-hover:text-amber-400 transition-colors leading-tight">{s.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            onLike={() => handleLike(msg.id)}
            onCopy={() => {}}
            onArtifactSelect={onArtifactSelect}
            onExportPDF={exportToPDF}
            t={t}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute right-6 bottom-28 z-20 w-10 h-10 bg-zinc-900 border border-amber-500/40 text-amber-400 rounded-full flex items-center justify-center shadow-xl hover:bg-amber-900/20 transition-all animate-in fade-in"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Input Area */}
      <div className="relative z-10 px-4 pb-4 pt-3 border-t border-amber-900/20 bg-black/70 backdrop-blur-md space-y-3">
        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-[10px] text-zinc-400 group"
              >
                {file.isImage
                  ? <img src={`data:${file.mimeType};base64,${file.data}`} className="w-5 h-5 rounded object-cover" />
                  : <Paperclip className="w-3 h-3 text-amber-500" />
                }
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all">
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex gap-2 items-end">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
          />

          {/* Attach Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl hover:text-amber-400 hover:border-amber-500/40 transition-all flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.chat?.placeholder || 'Ask IMPERIUM anything...'}
              className="w-full px-5 py-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/60 focus:border-amber-500/60 text-zinc-200 placeholder-zinc-600 text-sm transition-all pr-12"
            />
            {input.length > 0 && (
              <span className="absolute right-3 bottom-3 text-[9px] text-zinc-600 font-mono">
                {input.split(/\s+/).filter(Boolean).length}w
              </span>
            )}
          </div>

          {/* Voice Button */}
          <button
            onClick={toggleVoice}
            className={`p-3 rounded-xl border flex-shrink-0 transition-all ${
              isListening
                ? 'bg-red-950/40 border-red-500/60 text-red-400 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/40'
            }`}
            title={isListening ? 'Stop recording' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 text-black rounded-xl hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0 transform hover:scale-105 active:scale-95"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-center text-[9px] text-zinc-700 tracking-widest uppercase">
          IMPERIUM Intelligence • All languages supported • Web Search {webSearch ? 'Active' : 'Off'}
        </p>
      </div>
    </div>
  );
};
