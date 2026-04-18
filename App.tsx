import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare, Image as ImageIcon, Video, Radio, LayoutDashboard,
  Settings, Globe, Crown, Shield, Zap, Sparkles, ChevronLeft,
  ChevronRight, X, Download, Copy, Check, ExternalLink, Menu,
  Layers, Palette, FileText, TableProperties, BarChart3,
  LogOut, User, Bell, HelpCircle
} from 'lucide-react';
import { AppMode, Language, Artifact } from './types';
import { translations } from './translations';
import { ChatView } from './components/ChatView';
import { ImageGenView } from './components/ImageGenView';
import { VideoGenView } from './components/VideoGenView';
import { LiveView } from './components/LiveView';
import { ExcelGenView } from './components/ExcelGenView';
import { DocsView } from './components/DocsView';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [lang, setLang] = useState<Language>('fr');
  const [showArtifact, setShowArtifact] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);
  const [isNavPinned, setIsNavPinned] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Navigation Items
  const navItems = [
    { id: AppMode.CHAT, icon: MessageSquare, label: t.nav.chat, desc: 'Advanced AI Chat', color: 'from-amber-400 to-yellow-600' },
    { id: AppMode.DOCS, icon: FileText, label: t.nav.docs || 'Documents', desc: 'Expert Reports', color: 'from-blue-400 to-indigo-600' },
    { id: AppMode.EXCEL, icon: TableProperties, label: t.nav.excel, desc: 'Excel Architect', color: 'from-emerald-400 to-green-600' },
    { id: AppMode.IMAGE, icon: ImageIcon, label: t.nav.image, desc: 'Visual Arts', color: 'from-pink-400 to-rose-600' },
    { id: AppMode.VIDEO, icon: Video, label: t.nav.video, desc: 'Cinema Engine', color: 'from-purple-400 to-violet-600' },
    { id: AppMode.LIVE, icon: Radio, label: t.nav.live, desc: 'Neural Stream', color: 'from-sky-400 to-blue-600' },
  ];

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  ];

  const handleArtifactSelect = (art: Artifact) => {
    setActiveArtifact(art);
    setShowArtifact(true);
  };

  const handleCopyArtifact = () => {
    if (!activeArtifact) return;
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadArtifact = () => {
    if (!activeArtifact) return;
    const blob = new Blob([activeArtifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.CHAT: return <ChatView lang={lang} onArtifactSelect={handleArtifactSelect} />;
      case AppMode.IMAGE: return <ImageGenView lang={lang} />;
      case AppMode.VIDEO: return <VideoGenView lang={lang} />;
      case AppMode.LIVE: return <LiveView lang={lang} />;
      case AppMode.EXCEL: return <ExcelGenView lang={lang} onArtifactSelect={handleArtifactSelect} />;
      case AppMode.DOCS: return <DocsView lang={lang} onArtifactSelect={handleArtifactSelect} />;
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen bg-black text-zinc-100 overflow-hidden font-sans ${isRtl ? 'flex-row-reverse' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Navigation Sidebar */}
      <motion.nav
        initial={false}
        animate={{ width: isNavPinned ? '260px' : '80px' }}
        className="relative z-30 h-full bg-zinc-950 border-r border-amber-900/20 flex flex-col items-center py-6 transition-all duration-300"
      >
        {/* Branding */}
        <div className={`flex items-center gap-3 px-4 mb-10 w-full overflow-hidden ${isNavPinned ? 'justify-start' : 'justify-center'}`}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-900/20">
            <Crown className="w-6 h-6 text-black" />
          </div>
          {isNavPinned && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col whitespace-nowrap">
              <span className="text-sm font-black text-amber-200 font-['Cinzel'] tracking-widest">IMPERIUM</span>
              <span className="text-[8px] text-zinc-500 uppercase tracking-tighter">Rida Hamada Intelligence</span>
            </motion.div>
          )}
        </div>

        {/* Mode Selectors */}
        <div className="flex-1 w-full px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`group relative flex items-center gap-4 w-full p-3.5 rounded-2xl transition-all duration-200 ${
                mode === item.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${mode === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              {isNavPinned && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-start overflow-hidden">
                  <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                  <span className="text-[9px] text-zinc-600 truncate">{item.desc}</span>
                </motion.div>
              )}
              {mode === item.id && (
                <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full" />
              )}
            </button>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="w-full px-3 space-y-2">
          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className={`flex items-center gap-4 w-full p-3.5 rounded-2xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-all ${!isNavPinned && 'justify-center'}`}
            >
              <Globe className="w-5 h-5 flex-shrink-0" />
              {isNavPinned && <span className="text-[11px] font-bold uppercase tracking-widest">{languages.find(l=>l.code===lang)?.label}</span>}
            </button>

            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className={`absolute bottom-full mb-2 ${isNavPinned ? 'left-0' : 'left-full ml-4'} w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50`}
                >
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as Language); setShowLangMenu(false); }}
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs transition-colors ${
                        lang === l.code ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                      }`}
                    >
                      <span>{l.flag} {l.label}</span>
                      {lang === l.code && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsNavPinned(!isNavPinned)}
            className={`flex items-center gap-4 w-full p-3.5 rounded-2xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-all ${!isNavPinned && 'justify-center'}`}
          >
            {isNavPinned ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {isNavPinned && <span className="text-[11px] font-bold uppercase tracking-widest">Collapse Menu</span>}
          </button>
        </div>
      </motion.nav>

      {/* Main UI Container */}
      <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Artifact / Specialist Panel */}
      <AnimatePresence>
        {showArtifact && activeArtifact && (
          <motion.aside
            initial={{ x: isRtl ? -600 : 600 }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? -600 : 600 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 z-40 w-full max-w-2xl bg-zinc-950 border border-amber-900/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Artifact Header */}
            <div className={`flex items-center justify-between px-6 py-4 bg-zinc-900/50 border-b border-amber-900/20 ${isRtl ? 'flex-row-reverse' : ''}`}>
               <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                    {activeArtifact.type === 'code' ? <Code className="w-4 h-4" /> :
                     activeArtifact.type === 'data' ? <TableProperties className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-200 font-['Cinzel'] tracking-widest truncate max-w-sm">
                      {activeArtifact.title}
                    </h3>
                    <div className={`flex items-center gap-2 mt-0.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[9px] uppercase font-black text-amber-500/60">{activeArtifact.type}</span>
                      <span className="text-[9px] text-zinc-600 tracking-tighter">• CREATED BY IMPERIUM</span>
                    </div>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyArtifact}
                    className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-800"
                    title="Copy Content"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownloadArtifact}
                    className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-800"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-zinc-800 mx-1" />
                  <button
                    onClick={() => setShowArtifact(false)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all border border-transparent hover:border-red-900/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {/* Artifact Content Area */}
            <div className="flex-1 overflow-auto p-0 bg-zinc-950">
               <pre className="p-8 text-xs text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30 selection:text-amber-200">
                 {activeArtifact.content}
               </pre>
            </div>

            {/* Artifact Footer */}
            <div className={`px-6 py-3 bg-zinc-900/30 border-t border-amber-900/10 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-widest">
                   <Shield className="w-3.5 h-3.5 text-amber-800" /> Secure Node
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-widest">
                   <Zap className="w-3.5 h-3.5 text-amber-800" /> Final Render
                 </div>
              </div>
              <div className="text-[10px] font-bold text-amber-500/50 tracking-tighter uppercase">
                 IMPERIUM Intelligence © 2024
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Global Modals / Notifications Can Go Here */}
    </div>
  );
}
