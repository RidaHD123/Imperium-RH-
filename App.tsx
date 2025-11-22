
import React, { useState } from 'react';
import { AppMode, Language } from './types';
import { ChatView } from './components/ChatView';
import { ImageGenView } from './components/ImageGenView';
import { VideoGenView } from './components/VideoGenView';
import { LiveView } from './components/LiveView';
import { translations } from './translations';
import { MessageSquare, Image as ImageIcon, Video, Mic, Menu, Crown, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [lang, setLang] = useState<Language>('fr');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const t = translations[lang];
  const isRtl = lang === 'ar';

  const renderContent = () => {
    switch (mode) {
      case AppMode.CHAT: return <ChatView lang={lang} />;
      case AppMode.IMAGE: return <ImageGenView lang={lang} />;
      case AppMode.VIDEO: return <VideoGenView lang={lang} />;
      case AppMode.LIVE: return <LiveView lang={lang} />;
      default: return <ChatView lang={lang} />;
    }
  };

  const NavButton = ({ targetMode, icon: Icon, label }: { targetMode: AppMode, icon: any, label: string }) => (
    <button
      onClick={() => {
        setMode(targetMode);
        setIsMenuOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg transition-all duration-300 border ${
        mode === targetMode 
          ? 'bg-gradient-to-r from-amber-900/40 to-black border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
          : 'border-transparent text-slate-400 hover:text-amber-200 hover:bg-white/5'
      } ${isRtl ? 'flex-row-reverse' : ''}`}
    >
      <Icon className={`w-5 h-5 ${mode === targetMode ? 'text-amber-400' : ''}`} />
      <span className={`font-medium tracking-wide ${mode === targetMode ? 'text-gold-shiny' : ''}`}>{label}</span>
    </button>
  );

  const LanguageSelector = () => (
      <div className="grid grid-cols-3 gap-2 p-2">
          {[
              { code: 'fr', label: 'FR' },
              { code: 'en', label: 'EN' },
              { code: 'ar', label: 'عربي' },
              { code: 'es', label: 'ES' },
              { code: 'de', label: 'DE' },
              { code: 'no', label: 'NO' }
          ].map((l) => (
              <button
                  key={l.code}
                  onClick={() => setLang(l.code as Language)}
                  className={`text-[10px] font-bold py-1 rounded border transition-all ${
                      lang === l.code 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'
                  }`}
              >
                  {l.label}
              </button>
          ))}
      </div>
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'} z-30 w-72 bg-zinc-950 border-amber-900/20 transform transition-transform duration-200 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
      `}>
        <div className="h-full flex flex-col p-6 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-0 w-full h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 px-2 py-6 mb-6 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Crown className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gold-shiny tracking-widest font-['Cinzel']">IMPERIUM</h1>
              <p className="text-xs text-amber-500/60 font-bold tracking-[0.3em] ml-1">RH • SYSTEM</p>
            </div>
          </div>

          <nav className="flex-1 space-y-3">
            <NavButton targetMode={AppMode.CHAT} icon={MessageSquare} label={t.nav.chat} />
            <NavButton targetMode={AppMode.IMAGE} icon={ImageIcon} label={t.nav.image} />
            <NavButton targetMode={AppMode.VIDEO} icon={Video} label={t.nav.video} />
            <NavButton targetMode={AppMode.LIVE} icon={Mic} label={t.nav.live} />
          </nav>

          <div className="mt-auto space-y-4 border-t border-amber-900/20 pt-4">
            <div className="px-2">
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
                    <Globe className="w-3 h-3" />
                    Langue / Language
                </label>
                <LanguageSelector />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 text-center">
              {t.nav.footer}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-black relative">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-black to-black pointer-events-none" />
        
        {/* Mobile Header */}
        <header className="md:hidden bg-zinc-950 border-b border-amber-900/20 p-4 flex items-center gap-4 relative z-10">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-zinc-900 rounded-lg text-amber-500">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gold-shiny tracking-widest">IMPERIUM RH</span>
        </header>

        <div className="flex-1 h-full overflow-hidden p-0 md:p-6 relative z-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
