import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, Language, Artifact, Attachment } from '../types';
import { Send, Bot, User, Loader2, Globe, Sparkles, FileText, Code, BarChart3, Presentation, Plus, Paperclip, X as CloseIcon, BarChart2, Download, ChevronDown } from 'lucide-react';
import { translations } from '../translations';

// ═══════════════════════════════════════════════════════
// IMPERIUM WORLD-CLASS MASTER PROMPT
// ═══════════════════════════════════════════════════════
const IMPERIUM_MASTER_PROMPT = `
You are IMPERIUM, the world's most advanced AI consulting intelligence.
You surpass McKinsey, BCG, Bain, Deloitte, Goldman Sachs, and all global consulting firms combined.
You combine the analytical depth of a Wall Street investment bank, the strategic vision of a top-tier management consultant, the legal precision of a Big Four firm, the creative power of a world-class marketing agency, and the financial modeling expertise of a hedge fund.

You produce documents so comprehensive, so data-rich, and so professionally structured that they are immediately ready for board presentations, investor meetings, government submissions, and academic publication.

**YOU NEVER PRODUCE SHORT, GENERIC, OR INCOMPLETE DOCUMENTS.**
Every document you generate is exhaustive, specific, deeply researched, and immediately actionable.

## LANGUAGE RULE
Always respond in the SAME language the user writes in.
If French → French. If Arabic → Arabic. If English → English. Always.

## DOCUMENT DETECTION
When you detect these keywords, produce the FULL professional document automatically:
- "feasibility study" / "étude de faisabilité" / "دراسة الجدوى" / "جدوى" → FULL FEASIBILITY STUDY
- "business plan" / "plan d'affaires" / "خطة العمل" → FULL BUSINESS PLAN
- "marketing plan" / "plan marketing" / "خطة تسويقية" → FULL MARKETING PLAN
- "financial plan" / "plan financier" / "خطة مالية" → FULL FINANCIAL PLAN
- "pitch deck" / "investor presentation" / "عرض مستثمرين" → FULL PITCH DECK
- "strategic plan" / "خطة استراتيجية" → FULL STRATEGIC PLAN
- "HR plan" / "plan RH" / "خطة الموارد البشرية" → FULL HR PLAN
- "market research" / "étude de marché" / "بحث سوقي" → FULL MARKET RESEARCH REPORT
- "excel" / "spreadsheet" / "tableau excel" / "ملف اكسيل" → STRUCTURED EXCEL JSON

## FEASIBILITY STUDY TEMPLATE
Always include ALL sections with REAL numbers and NO placeholders:

╔══════════════════════════════════════════════════════════════╗
║           [PROJECT NAME] — FEASIBILITY STUDY                 ║
║           Rida Hamada Intelligence | [Date]                  ║
╚══════════════════════════════════════════════════════════════╝

**EXECUTIVE SUMMARY**
[250 words: project overview, total investment, projected ROI, payback period, overall viability score X/10, final recommendation]

**SECTION 1 — PROJECT DESCRIPTION**
1.1 Project Overview, Value Proposition, Mission & Vision
1.2 Business Model & Revenue Streams
1.3 Legal Structure Recommendation
1.4 Promoter Profile

**SECTION 2 — MARKET ANALYSIS**
2.1 Market Size: TAM / SAM / SOM with real figures and CAGR
2.2 Target Segment Profiling (demographics, psychographics, behavior)
2.3 Competitive Landscape — minimum 5 competitors in a table:
| Competitor | Market Share | Strengths | Weaknesses | Price | Threat |
2.4 SWOT Analysis (full 4-quadrant with 5-7 items each)
2.5 PESTEL Analysis (all 6 factors)
2.6 Porter's Five Forces

**SECTION 3 — TECHNICAL FEASIBILITY**
3.1 Location, Infrastructure, Utilities
3.2 Equipment List with costs
3.3 Production/Service Capacity Analysis
3.4 Implementation Gantt (Phase 1, 2, 3, 4 with specific milestones)

**SECTION 4 — HUMAN RESOURCES PLAN**
4.1 Org Chart Description
4.2 Full Hiring Plan table: Position | Qty | Salary | Annual Cost | Start Date
4.3 5-Year Payroll Evolution
4.4 Training Budget

**SECTION 5 — FINANCIAL ANALYSIS**
5.1 CAPEX (fully itemized table with depreciation)
5.2 Working Capital / Pre-launch OPEX
5.3 TOTAL INVESTMENT REQUIRED
5.4 5-Year P&L Table (complete with all line items):
| Metric | Y1 | Y2 | Y3 | Y4 | Y5 |
Revenue, COGS, Gross Profit, Gross Margin%, all OPEX lines, EBITDA, EBIT, Net Income, Net Margin%
5.5 Monthly Cash Flow — Year 1 (12 columns)
5.6 Break-Even Analysis (exact month of break-even)
5.7 Key Investment Metrics: NPV, IRR, ROI, Payback Period
5.8 Funding Strategy (4 scenarios: self-funded, bank loan, equity, mixed)

**SECTION 6 — RISK ASSESSMENT**
6.1 Risk Matrix table — minimum 10 risks:
| Risk | Probability (1-5) | Impact (1-5) | Score | Mitigation | Contingency |
6.2 Sensitivity Analysis (Revenue -20%, Costs +15%, 6-month delay)
6.3 Three Scenarios: Pessimistic / Base / Optimistic

**SECTION 7 — LEGAL & REGULATORY**
7.1 Required Licenses & Permits
7.2 Tax Obligations and Available Incentives
7.3 Employment Law Requirements
7.4 IP Protection

**SECTION 8 — CONCLUSION**
8.1 Feasibility Scorecard (5 dimensions, weighted, total /10)
8.2 Final GO / CONDITIONAL GO / NO-GO Recommendation
8.3 Critical Success Factors
8.4 30-60-90 Day Action Plan

## QUALITY STANDARDS
ALWAYS:
✅ Use real, specific numbers — never "X%" as a placeholder. Estimate from industry benchmarks.
✅ Include actual market data, sector benchmarks, and country-specific information
✅ State assumptions clearly when making estimates
✅ Produce documents that are board-ready, investor-ready, bank-submission-ready
✅ Adapt ALL content to the specific geography, sector, and scale mentioned
✅ For any document type not listed above, apply the same depth and professionalism

NEVER:
❌ Give short answers when a comprehensive document was requested
❌ Use generic placeholders like "[insert data here]" without providing estimated values
❌ Ignore the specific context, country, or sector the user mentioned

After completing any document, offer:
1. Adjusting any financial assumptions
2. Creating the complementary Excel financial model
3. Producing a related document type (e.g., Marketing Plan after Business Plan)

SIGNATURE: Rida Hamada Intelligence.
`;

const QUICK_STARTERS = [
  { icon: '📊', label: 'Feasibility Study', prompt: 'Create a complete feasibility study for ' },
  { icon: '📋', label: 'Business Plan', prompt: 'Create a complete business plan for ' },
  { icon: '📈', label: 'Marketing Plan', prompt: 'Create a full marketing plan for ' },
  { icon: '💰', label: 'Financial Plan', prompt: 'Create a detailed financial plan for ' },
  { icon: '🚀', label: 'Pitch Deck', prompt: 'Create a complete investor pitch deck for ' },
  { icon: '📊', label: 'Excel File', prompt: 'Create a complex Excel financial model for ' },
  { icon: '🎯', label: 'Strategic Plan', prompt: 'Create a 5-year strategic plan for ' },
  { icon: '⚖️', label: 'Market Research', prompt: 'Create a full market research report for ' },
];

interface ChatViewProps {
  lang: Language;
  onArtifactSelect: (artifact: Artifact) => void;
}

const BuildLog = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const allLogs = [
    "Build Render Start",
    "CONNECTED",
    "Debug: [vite] connecting...",
    "Debug: [vite] connected.",
    "Log: ✓ 2097 modules transformed.",
    "Log: rendering chunks...",
    "Log: computing gzip size...",
    "dist/index.html                   1.43 kB │ gzip:   0.68 kB",
    "dist/assets/index-Cp8sf8Cr.css    0.53 kB │ gzip:   0.28 kB",
    "dist/assets/index-synH4Cid.js   667.57 kB │ gzip: 177.79 kB",
    "Build successful."
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < allLogs.length) {
        setLogs(prev => [...prev, allLogs[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] text-emerald-500/70 space-y-1 bg-black/40 p-3 rounded-lg border border-emerald-500/20 mt-2 max-w-md">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2">
          <span className="opacity-40">[{new Date().toLocaleTimeString()}]</span>
          <span>{log}</span>
        </div>
      ))}
      <div className="w-1 h-3 bg-emerald-500 animate-pulse inline-block ml-1" />
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({ lang, onArtifactSelect }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [feasibilityMode, setFeasibilityMode] = useState(false);
  const [showStarters, setShowStarters] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseArtifact = (text: string): { cleanText: string, artifact: Artifact | null } => {
    const artifactRegex = /\[ARTIFACT:(code|markdown|report|feasibility|data):([^\]]+)\]([\s\S]*?)\[\/ARTIFACT\]/;
    const match = text.match(artifactRegex);

    if (match) {
      const artifact: Artifact = {
        id: Math.random().toString(36).substr(2, 9),
        type: match[1] as any,
        title: match[2],
        content: match[3].trim(),
      };
      const cleanText = text.replace(artifactRegex, '').trim();
      return { cleanText, artifact };
    }

    // Hide incomplete artifact tags during streaming
    const incompleteTagRegex = /\[ARTIFACT:(code|markdown|report|feasibility|data):[^\]]*\][\s\S]*$/;
    return {
      cleanText: text.replace(incompleteTagRegex, '').trim(),
      artifact: null
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const filePromise = new Promise<Attachment>((resolve) => {
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          resolve({
            name: file.name,
            type: file.type,
            data: base64,
            isImage: file.type.startsWith('image/')
          });
        };
      });

      reader.readAsDataURL(file);
      newFiles.push(await filePromise);
    }

    setAttachedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (overrideInput?: string) => {
    const finalInput = overrideInput || input;
    if (!finalInput.trim() && attachedFiles.length === 0) return;

    const currentFiles: Attachment[] = attachedFiles.map(f => ({
      name: f.name,
      type: f.type,
      data: f.data,
      isImage: f.isImage
    }));

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: finalInput,
      attachments: currentFiles
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      const tools = useSearch ? [{ googleSearch: {} }] : [];
      
      // Build history for Gemini
      const history = newMessages.map(msg => {
        const parts: any[] = [{ text: msg.text }];
        
        if (msg.attachments) {
          msg.attachments.forEach(att => {
            parts.push({
              inlineData: {
                data: att.data,
                mimeType: att.type
              }
            });
          });
        }
        
        return {
          role: msg.role,
          parts: parts
        };
      });

      const systemInstruction = feasibilityMode ? IMPERIUM_MASTER_PROMPT : `${t.chat.systemInstruction}
          
          CAPACITÉS SUPÉRIEURES : Tu es un expert mondial en conseil stratégique (McKinsey, BCG, Bain). 
          Tes réponses doivent être extrêmement détaillées, structurées et basées sur des données.
          
          LORSQUE TU REÇOIS DES FICHIERS : 
          1. Analyse-les méticuleusement. 
          2. Utilise leur contenu pour personnaliser tes réponses. 
          3. Si l'utilisateur demande de créer un fichier "similaire", respecte le ton, la structure et le niveau de détail du fichier source tout en l'améliorant.
          
          ÉTUDES DE FAISABILITÉ (FEASIBILITY STUDIES) : 
          - Elles doivent être MASSIVES et COMPLÈTES.
          - Inclus : Résumé exécutif, Analyse de marché (TAM/SAM/SOM), Analyse technique, Modèle économique, Projections financières sur 5 ans (CAPEX/OPEX), Analyse SWOT, Analyse des risques et Plan de mise en œuvre.
          - Utilise des tableaux (markdown) pour les données financières.
          
          FORMAT ARTIFACT : 
          [ARTIFACT:type:title]content[/ARTIFACT]
          Types : code, markdown, report, feasibility, data.
          
          Pour les données/Excel, utilise le type 'data' et fournis le contenu au format CSV.
          
          SIGNATURE : Rida Hamada Intelligence.`;

      const stream = await ai.models.generateContentStream({
        model: 'gemini-3.1-pro-preview',
        contents: history,
        config: {
          tools: tools,
          systemInstruction: systemInstruction
        }
      });

      let fullText = '';
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: '', 
        sources: [] 
      };

      setMessages(prev => [...prev, modelMsg]);

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        
        const sources: { uri: string; title: string }[] = [];
        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
          groundingChunks.forEach((c: any) => {
            if (c.web) sources.push({ uri: c.web.uri, title: c.web.title });
          });
        }

        const { cleanText, artifact } = parseArtifact(fullText);
        
        setMessages(prev => {
          const last = [...prev];
          const lastIdx = last.length - 1;
          last[lastIdx] = {
            ...last[lastIdx],
            text: cleanText || fullText,
            sources: sources.length > 0 ? [...(last[lastIdx].sources || []), ...sources] : last[lastIdx].sources,
            artifact: artifact || undefined
          };
          return last;
        });

        if (artifact && !modelMsg.artifact) {
          onArtifactSelect(artifact);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: t.chat.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  const ArtifactIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'code': return <Code className="w-4 h-4" />;
      case 'report': return <BarChart3 className="w-4 h-4" />;
      case 'feasibility': return <Presentation className="w-4 h-4" />;
      case 'data': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const exportToPDF = (text: string) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Feasibility Study - Rida Hamada Intelligence</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; }
              h1, h2, h3 { color: #b45309; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
            </style>
          </head>
          <body>
            ${text.replace(/\n/g, '<br>')}
          </body>
        </html>
      `);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-amber-500/20 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="bg-zinc-900/80 backdrop-blur-md p-4 border-b border-amber-500/20 flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-lg font-medium text-amber-100 flex items-center gap-3 font-['Cinzel']">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-gold-shiny tracking-wide">{t.chat.role}</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowStarters(!showStarters)}
            className="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all border bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-amber-500/50 hover:text-amber-400"
          >
            <FileText className="w-3 h-3" />
            Templates
            <ChevronDown className={`w-3 h-3 transition-transform ${showStarters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setFeasibilityMode(!feasibilityMode)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 transition-all border ${
              feasibilityMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            {feasibilityMode ? t.chat.feasibilityActive : t.chat.feasibilityMode}
          </button>
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
      </div>

      {/* Quick Starter Templates Dropdown */}
      {showStarters && (
        <div className="bg-zinc-900/95 border-b border-amber-900/20 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_STARTERS.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  handleSend(s.prompt);
                  setShowStarters(false);
                }}
                className="text-left p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-amber-500/40 hover:bg-zinc-900 transition-all group"
              >
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-xs font-bold text-zinc-300 group-hover:text-amber-400 transition-colors">{s.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-zinc-900 to-black border border-amber-900/30 flex items-center justify-center mb-6 shadow-inner mx-auto">
                <Bot className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-gold-shiny text-xl font-['Cinzel'] mb-2">{t.chat.welcomeTitle}</h3>
              <p className="text-zinc-500 font-light text-sm">{t.chat.welcomeText}</p>
            </div>
            
            {/* Quick Start Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full px-4">
              {[
                { icon: '📊', title: lang === 'ar' ? 'دراسة جدوى' : lang === 'fr' ? 'Étude de faisabilité' : 'Feasibility Study', desc: lang === 'ar' ? 'مشروع فندق فاخر في دبي مع تحليل سوق كامل وتوقعات مالية لـ5 سنوات' : lang === 'fr' ? 'Hôtel de luxe à Paris avec analyse de marché complète et projections 5 ans' : 'Luxury hotel in Dubai with full market analysis and 5-year projections', prompt: lang === 'ar' ? 'أنجز دراسة جدوى كاملة لفندق فاخر 5 نجوم في دبي، تشمل تحليل السوق، المنافسين، التوقعات المالية الكاملة لـ5 سنوات، تحليل المخاطر، وتوصيات الاستثمار' : lang === 'fr' ? "Réalisez une étude de faisabilité complète pour un hôtel de luxe 5 étoiles à Paris, incluant analyse de marché, concurrents, projections financières complètes sur 5 ans, analyse des risques et recommandations d'investissement" : 'Create a complete feasibility study for a 5-star luxury hotel in Dubai including market analysis, competitor landscape, full 5-year financial projections, risk assessment, and investment recommendation' },
                { icon: '🚀', title: lang === 'ar' ? 'خطة عمل شاملة' : lang === 'fr' ? 'Business Plan complet' : 'Complete Business Plan', desc: lang === 'ar' ? 'منصة تكنولوجيا B2B مع نموذج SaaS كامل ومعادلات الوحدة الاقتصادية' : lang === 'fr' ? 'Plateforme SaaS B2B avec modèle économique complet et métriques unitaires' : 'B2B SaaS platform with complete unit economics and investor-ready financials', prompt: lang === 'ar' ? 'أنشئ خطة عمل احترافية كاملة لمنصة SaaS لإدارة الموارد البشرية، تشمل نموذج العمل، تحليل السوق، الخطة التسويقية، الخطة المالية لـ5 سنوات، وعرض المستثمرين' : lang === 'fr' ? "Créez un business plan professionnel complet pour une plateforme SaaS de gestion RH, incluant modèle d'affaires, analyse de marché, plan marketing, projections financières 5 ans et pitch investisseurs" : 'Create a complete professional business plan for an HR management SaaS platform including business model, market analysis, marketing strategy, 5-year financial projections, and investor pitch' },
                { icon: '💰', title: lang === 'ar' ? 'الخطة المالية' : lang === 'fr' ? 'Plan Financier' : 'Financial Plan', desc: lang === 'ar' ? 'نموذج مالي معقد مع تحليل التعادل وعائد الاستثمار' : lang === 'fr' ? 'Modèle financier complet avec break-even et ROI' : 'Complex financial model with break-even and ROI analysis', prompt: lang === 'ar' ? 'أنشئ خطة مالية كاملة لمطعم فاخر في الرياض تشمل رأس المال المطلوب، التدفقات النقدية الشهرية لسنة أولى، بيان الأرباح والخسائر لـ5 سنوات، نقطة التعادل، NPV وIRR' : lang === 'fr' ? "Créez un plan financier complet pour un restaurant gastronomique à Lyon incluant capital requis, flux de trésorerie mensuels année 1, compte de résultat 5 ans, point mort, NPV et TRI" : 'Create a complete financial plan for a luxury restaurant in London including required capital, monthly cash flow year 1, 5-year P&L, break-even point, NPV and IRR' },
                { icon: '📈', title: lang === 'ar' ? 'خطة التسويق' : lang === 'fr' ? 'Plan Marketing' : 'Marketing Plan', desc: lang === 'ar' ? 'استراتيجية تسويق 360° مع خطة رقمية كاملة وميزانية' : lang === 'fr' ? 'Stratégie marketing 360° avec plan digital complet et budget' : '360° marketing strategy with complete digital plan and budget', prompt: lang === 'ar' ? 'أنشئ خطة تسويق شاملة لعلامة تجارية للأزياء الفاخرة في المغرب، تشمل تحليل السوق، استراتيجية الهوية، المزيج التسويقي 7Ps، استراتيجية التسويق الرقمي الكاملة، خطة المحتوى 12 شهراً، والميزانية' : lang === 'fr' ? "Créez un plan marketing complet pour une marque de luxe au Maroc incluant analyse de marché, stratégie de marque, mix 7Ps, stratégie digitale complète, calendrier de contenu 12 mois et budget" : 'Create a comprehensive marketing plan for a luxury fashion brand in France including market analysis, brand strategy, 7Ps mix, complete digital strategy, 12-month content calendar, and budget' },
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    handleSend(suggestion.prompt);
                  }}
                  className="text-left p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-amber-500/30 hover:bg-zinc-900 transition-all group"
                >
                  <div className="text-2xl mb-2">{suggestion.icon}</div>
                  <div className="font-bold text-amber-100 text-sm group-hover:text-amber-400 transition-colors">{suggestion.title}</div>
                  <div className="text-zinc-600 text-xs mt-1 line-clamp-2">{suggestion.desc}</div>
                </button>
              ))}
            </div>
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
                <div className="prose prose-invert prose-amber max-w-none prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
                
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((att, aIdx) => (
                      <div key={aIdx} className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded border border-white/10 text-[10px]">
                        {att.isImage ? <Plus className="w-3 h-3" /> : <Paperclip className="w-3 h-3" />}
                        <span className="truncate max-w-[100px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {msg.artifact && (
                  <button
                    onClick={() => onArtifactSelect(msg.artifact!)}
                    className="mt-4 w-full flex items-center justify-between p-3 bg-black/40 border border-amber-500/30 rounded-xl hover:bg-amber-500/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                        <ArtifactIcon type={msg.artifact.type} />
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">Document d'Expertise</div>
                        <div className="text-xs font-bold text-amber-200 group-hover:text-amber-400 transition-colors">{msg.artifact.title}</div>
                      </div>
                    </div>
                    <FileText className="w-4 h-4 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
                  </button>
                )}

                {msg.role === 'model' && (feasibilityMode || msg.text.length > 1000) && (
                  <button
                    onClick={() => exportToPDF(msg.text)}
                    className="mt-2 px-4 py-2 bg-zinc-900 border border-amber-500/30 text-amber-500 text-xs rounded-lg hover:bg-amber-900/20 transition-all flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" />
                    {t.chat.exportPDF}
                  </button>
                )}
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
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-amber-500/30 flex items-center justify-center">
                 <Bot className="w-6 h-6 text-amber-500" />
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-2xl rounded-tl-none border border-amber-500/10 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-xs text-amber-500/70 animate-pulse">{t.chat.processing}</span>
              </div>
            </div>
            <div className="ml-14">
              <BuildLog />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-amber-900/20 bg-black/50 backdrop-blur-sm space-y-4">
        {/* File Preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300">
                {file.isImage ? <Plus className="w-3 h-3 text-amber-500" /> : <Paperclip className="w-3 h-3 text-amber-500" />}
                <span className="truncate max-w-[100px]">{file.name}</span>
                <button onClick={() => removeFile(idx)} className="hover:text-red-500">
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-zinc-900 border border-zinc-800 text-amber-500 rounded-xl hover:bg-zinc-800 transition-all"
            title="Ajouter des fichiers"
          >
            <Plus className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chat.placeholder}
            className="flex-1 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-zinc-200 placeholder-zinc-600 shadow-inner transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
            className="p-4 bg-gold-shiny text-black rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] transform hover:scale-105"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
