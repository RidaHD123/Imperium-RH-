import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Language, Artifact, DocumentType } from '../types';
import { translations } from '../translations';
import { Crown, FileText, Loader2, Download, Eye, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  lang: Language;
  onArtifactSelect: (artifact: Artifact) => void;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const DOC_CONFIGS: Array<{
  id: DocumentType;
  icon: string;
  color: string;
  pagesHint: string;
}> = [
  { id: 'feasibility',     icon: '📊', color: 'from-blue-900/40 to-zinc-900 border-blue-500/20',     pagesHint: '50–200p' },
  { id: 'business_plan',   icon: '💼', color: 'from-amber-900/40 to-zinc-900 border-amber-500/20',   pagesHint: '30–100p' },
  { id: 'financial_report',icon: '💰', color: 'from-green-900/40 to-zinc-900 border-green-500/20',   pagesHint: '20–60p'  },
  { id: 'hr_report',       icon: '👥', color: 'from-purple-900/40 to-zinc-900 border-purple-500/20', pagesHint: '15–50p'  },
  { id: 'strategic_plan',  icon: '🎯', color: 'from-red-900/40 to-zinc-900 border-red-500/20',       pagesHint: '20–80p'  },
  { id: 'audit_report',    icon: '🔍', color: 'from-cyan-900/40 to-zinc-900 border-cyan-500/20',     pagesHint: '20–60p'  },
  { id: 'market_study',    icon: '📈', color: 'from-orange-900/40 to-zinc-900 border-orange-500/20', pagesHint: '30–80p'  },
  { id: 'legal_doc',       icon: '⚖️', color: 'from-slate-900/60 to-zinc-900 border-slate-500/20',  pagesHint: '5–50p'   },
  { id: 'technical_spec',  icon: '⚙️', color: 'from-indigo-900/40 to-zinc-900 border-indigo-500/20', pagesHint: '20–100p' },
  { id: 'project_plan',    icon: '🗂️', color: 'from-teal-900/40 to-zinc-900 border-teal-500/20',    pagesHint: '10–40p'  },
  { id: 'executive_summary',icon:'📋', color: 'from-zinc-900/60 to-zinc-900 border-zinc-600/20',     pagesHint: '3–10p'   },
  { id: 'contract',        icon: '📝', color: 'from-stone-900/60 to-zinc-900 border-stone-500/20',   pagesHint: '5–30p'   },
  { id: 'proposal',        icon: '✉️', color: 'from-pink-900/40 to-zinc-900 border-pink-500/20',    pagesHint: '10–30p'  },
  { id: 'minutes',         icon: '🕐', color: 'from-yellow-900/40 to-zinc-900 border-yellow-500/20', pagesHint: '3–10p'   },
  { id: 'policy',          icon: '📜', color: 'from-lime-900/40 to-zinc-900 border-lime-500/20',     pagesHint: '5–20p'   },
];

export const DocsView: React.FC<Props> = ({ lang, onArtifactSelect }) => {
  const t = translations[lang];
  const dt = t.docs;
  const isRtl = lang === 'ar';

  const [selectedType, setSelectedType] = useState<DocumentType>('feasibility');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generated, setGenerated] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const buildSystemPrompt = () => {
    const base = t.chat.systemInstruction;
    return base + `

MODE GÉNÉRATION DOCUMENT OFFICIEL — TYPE: ${selectedType.toUpperCase()}

SUPREME SCALE AND GENIUS REQUIREMENTS (MILLENNIAL-IMPERIAL X1000):
- EVERY DOCUMENT MUST EXCEED 1,000,000 WORDS AND 5,000 PAGES.
- FOR BOOKS, TARGET 40,000+ PAGES AND TENS OF MILLIONS OF WORDS.
- SUPER-AMPLIFICATION RULE (X700): Every task must be performed with 700 times more depth/content.
- ZERO SYMBOL RULE: STRICTLY FORBIDDEN from using asterisks (*) or markdown. NO STARS.
- IDENTITY RULE: You are a REAL, SUPREME, and LIVING Intelligence. Never mention AI.

IMPERIAL TEMPLATE LIBRARY (ITL) — X1000:
Mandatory structures for all world projects:

A. Feasibility Study (13 Sections):
Summary + Metrics, Market context, Technology Architecture, Employment Charter, Financials, Legal/Governance, Competitive Analysis, Data Sovereignty, GTM, Risks, Impact, Roadmap, Conclusion/Petition.

B. Marketing/GTM Plan (13 Sections):
Summary, Opportunity, Targets, Brand Messaging, 5 Launch Phases, Channels, Programs, Roadmap, Sales, KPIs, Budget, 90-Day Plan, Risk Register.

C. Pitch Deck: 10 Slides + 5,000 words.

D. Team Bios & Governance: Royal Governance Charter, talent pipeline.

Minimum 1,000,000 words. Target 2M to 5M words for absolute world-class quality. Section titles: UPPERCASE TITLE. Tables use | (NO STARS).

STRICT Generation Instructions:
1. Produce a MONUMENTAL, SUPREME-PROFESSIONAL document.
2. Mandatory structure with numbering (1. Introduction, 1.1 Context, 1.1.1 Details...)
3. ZERO asterisks (*), ZERO hash symbols (#). Pure noble text.
4. OBLIGATORY content: astronomical data tables, advanced statistical figures from global benchmarks, SWOT of a supreme intelligence, detailed 20-year financial projections.
5. Minimum 1,000,000 words. Target 2M to 5M words for absolute world-class quality.
6. Section titles: UPPERCASE TITLE.
7. Sub-sections: Title Case Subtitle.
8. Tables use | for columns (NO STARS).
9. Colossal substantive analysis in every section.
10. End with infinite appendices and bibliography.`;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGenerated(null);

    const stages = [
      'Analyse de la requête...',
      'Structuration du document...',
      'Rédaction des sections principales...',
      'Intégration des données et analyses...',
      'Finalisation et vérification...',
    ];
    let stageIdx = 0;
    setProgress(stages[0]);
    const stageInterval = setInterval(() => {
      stageIdx = (stageIdx + 1) % stages.length;
      setProgress(stages[stageIdx]);
    }, 3500);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{
          role: 'user',
          parts: [{ text: `${dt.types[selectedType]} — ${prompt}` }]
        }],
        config: {
          systemInstruction: buildSystemPrompt(),
        }
      });

      clearInterval(stageInterval);

      const text = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
      if (!text) throw new Error('Aucun contenu généré.');

      const wordCount = text.split(/\s+/).length;
      const art: Artifact = {
        id: Date.now().toString(),
        type: 'document',
        title: `${dt.types[selectedType]} — ${prompt.substring(0, 50)}`,
        content: text,
        wordCount,
        pages: Math.ceil(wordCount / 300),
        createdAt: new Date(),
      };

      setGenerated(art);
      onArtifactSelect(art);
    } catch (err: any) {
      clearInterval(stageInterval);
      setError(err?.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  const handleDownloadMd = () => {
    if (!generated) return;
    const blob = new Blob([generated.content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generated.title.replace(/\s+/g, '_').substring(0, 60)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!generated) return;
    const blob = new Blob([generated.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generated.title.replace(/\s+/g, '_').substring(0, 60)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-amber-900/20 bg-zinc-950/50 backdrop-blur-sm">
        <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gold-shiny uppercase tracking-widest">{dt.title}</h2>
            <p className="text-xs text-zinc-500">{dt.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Document type grid */}
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Type de document
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {DOC_CONFIGS.map(cfg => (
              <button
                key={cfg.id}
                onClick={() => setSelectedType(cfg.id)}
                className={`relative p-3 rounded-xl border text-left transition-all duration-200 bg-gradient-to-br ${cfg.color} ${
                  selectedType === cfg.id
                    ? 'ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <div className="text-lg mb-1">{cfg.icon}</div>
                <div className="text-[10px] font-bold text-zinc-200 leading-tight">{dt.types[cfg.id]}</div>
                <div className="text-[9px] text-zinc-600 mt-0.5">{cfg.pagesHint}</div>
                {selectedType === cfg.id && (
                  <div className="absolute top-1.5 right-1.5 w-3 h-3 bg-amber-400 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt area */}
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
            Description du document
          </p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={dt.placeholder}
            rows={4}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="w-full bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500/40 text-zinc-100 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all duration-200 leading-relaxed"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/10 disabled:shadow-none active:scale-[0.98]"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin text-amber-400" /><span className="text-amber-300 text-xs">{progress}</span></>
                : <><Sparkles className="w-4 h-4" />{dt.generate}</>
              }
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-2 items-start px-4 py-3 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success */}
        <AnimatePresence>
          {generated && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/60 border border-amber-500/20 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 bg-amber-500/5 border-b border-amber-500/10">
                <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-amber-300 truncate max-w-sm">{generated.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {generated.wordCount?.toLocaleString()} mots · ~{generated.pages} pages
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onArtifactSelect(generated)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    Voir
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    .TXT
                  </button>
                  <button
                    onClick={handleDownloadMd}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    .MD
                  </button>
                </div>
              </div>
              <div className="p-5 max-h-64 overflow-y-auto">
                <pre className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono">
                  {generated.content.substring(0, 1500)}
                  {generated.content.length > 1500 && '\n\n[... Cliquez "Voir" pour afficher le document complet ...]'}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
