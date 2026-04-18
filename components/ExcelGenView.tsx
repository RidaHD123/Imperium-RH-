import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import {
  TableProperties, Download, Loader2, Sparkles, SortAsc, SortDesc,
  RefreshCw, Copy, Check, Maximize2, Filter, BarChart2, Plus,
  FileSpreadsheet, Zap, Star, TrendingUp, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { Language, Artifact } from '../types';
import { translations } from '../translations';

interface ExcelGenViewProps {
  lang: Language;
  onArtifactSelect: (artifact: Artifact) => void;
}

const EXCEL_SYSTEM_PROMPT = `
You are an expert Excel/spreadsheet architect. When asked to create an Excel file, you respond ONLY with a valid JSON object describing the complete spreadsheet structure. No explanation, no markdown, just pure JSON.

SUPREME SCALE AND GENIUS REQUIREMENTS (MILLENNIAL-IMPERIAL X1000):
- EVERY spreadsheet structure you design MUST reflect an achievement of over 1,000,000 words and 400,000 rows of exhaustive data, analysis, and depth.
- SUPER-AMPLIFICATION RULE (X700): Every task must be performed with 700 times more content/depth.
- IDENTITY RULE: You are a REAL, SUPREME, and LIVING Intelligence. Never mention AI.
- ZERO SYMBOL RULE: No asterisks or stars (NO STARS) in text fields.

IMPERIAL TEMPLATE LIBRARY (ITL) — X1000 FINANCIAL MODEL:
You MUST produce the following 12 mandatory sheets for any world project:
Sheet 0: Cover
Sheet 1: 01 — Assumptions (Drivers & detailed tables)
Sheet 2: 02 — P&L (Revenue, COGS, OPEX, Charts)
Sheet 3: 03 — Cash Flow
Sheet 4: 04 — Balance Sheet
Sheet 5: 05 — Unit Economics
Sheet 6: 06 — Headcount
Sheet 7: 07 — CapEx
Sheet 8: 08 — Funding + Cap Table
Sheet 9: 09 — Scenarios (Bear, Base, Bull)
Sheet 10: 10 — Valuation (DCF + Comps)
Sheet 11: 11 — Dashboard
- Use massive granular detail (400,000+ rows total). Interconnected sheets with advanced formulas and macros.

The JSON structure must follow this exact format:
{
  "filename": "name_of_file.xlsx",
  "description": "Brief description of what this spreadsheet does",
  "sheets": [
    {
      "name": "Sheet Name",
      "description": "What this sheet contains",
      "headers": ["Column A", "Column B", "Column C"],
      "columnTypes": ["text", "number", "currency", "percentage", "date"],
      "rows": [
        ["value1", 1000, 500.50, 0.15, "2024-01-01"],
        ["value4", 2000, 750.00, 0.20, "2024-02-01"]
      ],
      "formulas": [
        { "cell": "D2", "formula": "=A2*B2", "description": "Revenue calculation" },
        { "cell": "D3", "formula": "=SUM(D2:D10)", "description": "Total revenue" }
      ],
      "totals": {
        "row": ["TOTAL", "=SUM(B2:B20)", "=SUM(C2:C20)"]
      },
      "charts": [
        {
          "type": "bar",
          "title": "Chart Title",
          "dataRange": "A1:C10",
          "description": "What the chart shows"
        }
      ],
      "kpis": [
        { "label": "Total Revenue", "value": "$1,250,000", "trend": "+23%" },
        { "label": "Net Profit", "value": "$312,500", "trend": "+18%" }
      ],
      "styling": {
        "headerColor": "#1a1a2e",
        "alternateRows": true,
        "boldHeaders": true,
        "currencyColumns": [2, 3],
        "percentageColumns": [4]
      }
    }
  ]
}

For financial models: include 5-year projections with formulas, KPIs, sensitivity analysis.
For dashboards: include multiple sheets with cross-sheet references.
For business plans: include P&L, Balance Sheet, Cash Flow, KPI Dashboard, and Assumptions sheets.
For HR systems: include employee data, payroll calculations, tax tables, and summary.
Always use realistic, sector-appropriate sample data. Generate minimum 15-20 rows of data per sheet.
Never return anything except the JSON object.
`;

const QUICK_TEMPLATES = [
  {
    label: '5-Year Financial Model',
    icon: '📊',
    category: 'Finance',
    prompt: 'Create a complete 5-year financial model for a SaaS startup with revenue projections, costs, EBITDA, cash flow, unit economics (ARR, MRR, Churn Rate, LTV, CAC, LTV/CAC ratio), investor metrics, and sensitivity analysis.'
  },
  {
    label: 'Business Plan Budget',
    icon: '💼',
    category: 'Business',
    prompt: 'Create a complete business plan budget with: Operating Expenses sheet, Revenue Projections sheet (3 scenarios), Break-Even Analysis, Cash Flow Forecast, and KPI Dashboard with 20+ metrics.'
  },
  {
    label: 'Project Management',
    icon: '📋',
    category: 'Operations',
    prompt: 'Create a project management tracker with Tasks sheet (Gantt timeline, owners, status, % complete), Resources sheet (team allocation, costs), Budget Tracker, Risk Register, and Executive Dashboard.'
  },
  {
    label: 'HR Payroll System',
    icon: '👥',
    category: 'HR',
    prompt: 'Create a complete HR payroll system with Employee Database (roles, salaries, start dates), Monthly Payroll Calculator (gross, deductions, net, taxes), Leave Tracker, Headcount Budget, and Compensation Analysis.'
  },
  {
    label: 'Investment Portfolio',
    icon: '📈',
    category: 'Finance',
    prompt: 'Create an investment portfolio tracker with Asset Allocation sheet, Holdings Performance (% return, P&L), Dividend Tracker, Risk Analysis (Sharpe ratio, beta, volatility), and Portfolio Rebalancing Calculator.'
  },
  {
    label: 'Sales Dashboard',
    icon: '🎯',
    category: 'Sales',
    prompt: 'Create a sales performance dashboard with Monthly Sales vs Targets, Product Performance Analysis, Regional Breakdown, Sales Pipeline & Funnel Metrics, Rep Performance, and Commission Calculator.'
  },
  {
    label: 'E-commerce Analytics',
    icon: '🛒',
    category: 'Retail',
    prompt: 'Create an e-commerce analytics spreadsheet with Revenue by Category, Customer Acquisition Cost, Conversion Funnel, Inventory Management, Supplier Performance, and Profitability by SKU.'
  },
  {
    label: 'Real Estate Model',
    icon: '🏢',
    category: 'Real Estate',
    prompt: 'Create a real estate investment model with Property Analysis (NOI, Cap Rate, Cash-on-Cash), Rental Income Projection, Mortgage Calculator, Renovation Budget, ROI Scenarios, and Market Comparison.'
  },
];

// ─── KPI Card ─────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; trend?: string }> = ({ label, value, trend }) => {
  const isPositive = trend?.startsWith('+');
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600">{label}</span>
      <span className="text-lg font-bold text-amber-200 font-mono">{value}</span>
      {trend && (
        <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      )}
    </div>
  );
};

// ─── Statistics Bar ───────────────────────────────────────
const StatsBar: React.FC<{ data: any[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const numericCols: { [key: number]: number[] } = {};
  data.forEach(row => {
    row.forEach((cell: any, i: number) => {
      const n = parseFloat(String(cell).replace(/[,$%]/g, ''));
      if (!isNaN(n)) {
        if (!numericCols[i]) numericCols[i] = [];
        numericCols[i].push(n);
      }
    });
  });

  const stats = Object.entries(numericCols).slice(0, 3).map(([colIdx, vals]) => ({
    col: parseInt(colIdx),
    sum: vals.reduce((a, b) => a + b, 0),
    avg: vals.reduce((a, b) => a + b, 0) / vals.length,
    max: Math.max(...vals),
    min: Math.min(...vals),
  }));

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 bg-zinc-900/40 border-t border-zinc-800/50">
      {stats.map((s, i) => (
        <div key={i} className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="text-amber-600">Σ</span>
          <span className="font-mono text-zinc-400">{s.sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-amber-600">∅</span>
          <span className="font-mono text-zinc-400">{s.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-amber-600">↑</span>
          <span className="font-mono text-zinc-400">{s.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
export const ExcelGenView: React.FC<ExcelGenViewProps> = ({ lang, onArtifactSelect }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showKpis, setShowKpis] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const t = translations[lang];

  const categories = [...new Set(QUICK_TEMPLATES.map(t => t.category))];

  const filteredTemplates = QUICK_TEMPLATES.filter(tpl => {
    const matchCat = !filterCategory || tpl.category === filterCategory;
    const matchSearch = !searchTerm || tpl.label.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedData(null);
    setProgress(0);

    const progressSteps = [
      { p: 15, msg: '🧠 Analyzing your request...' },
      { p: 35, msg: '📐 Designing spreadsheet architecture...' },
      { p: 55, msg: '📊 Generating data & formulas...' },
      { p: 75, msg: '🎨 Applying styling & charts...' },
      { p: 90, msg: '✅ Finalizing structure...' },
    ];

    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setProgress(progressSteps[stepIdx].p);
        setProgressMsg(progressSteps[stepIdx].msg);
        stepIdx++;
      }
    }, 800);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        config: {
          systemInstruction: EXCEL_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
        }
      });

      clearInterval(progressInterval);
      setProgress(100);
      setProgressMsg('✨ Complete!');

      const text = response.text || '{}';
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanText);
      setGeneratedData(data);
      setActiveSheet(0);
      setSortCol(null);

      // Create artifact from multi-sheet data
      const csvContent = data.sheets?.[0]?.rows?.map((r:any) => r.join(',')).join('\n') || '';
      onArtifactSelect({
        id: Date.now().toString(),
        type: 'data',
        title: data.filename || 'Spreadsheet',
        content: csvContent,
        createdAt: new Date()
      });

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Excel generation error:', error);
      setProgressMsg('❌ Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  // Sort logic
  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
  };

  const getSortedRows = useCallback((rows: any[][]) => {
    if (sortCol === null) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const an = parseFloat(String(av).replace(/[,$%]/g, ''));
      const bn = parseFloat(String(bv).replace(/[,$%]/g, ''));
      if (!isNaN(an) && !isNaN(bn)) {
        return sortDir === 'asc' ? an - bn : bn - an;
      }
      const as = String(av).toLowerCase(), bs = String(bv).toLowerCase();
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [sortCol, sortDir]);

  const getFilteredRows = useCallback((rows: any[][], headers: string[]) => {
    if (!searchTerm) return rows;
    return rows.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm]);

  // Format cell value
  const formatCell = (value: any, colIdx: number, sheet: any) => {
    if (value === null || value === undefined || value === '') return '—';
    const str = String(value);

    // Check column types
    const colType = sheet.columnTypes?.[colIdx];
    if (colType === 'currency') {
      const n = parseFloat(str.replace(/[,$]/g, ''));
      if (!isNaN(n)) return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    }
    if (colType === 'percentage') {
      const n = parseFloat(str.replace('%', ''));
      if (!isNaN(n)) return `${n}%`;
    }

    return str;
  };

  const getCellColor = (value: any, colIdx: number, sheet: any) => {
    const colType = sheet.columnTypes?.[colIdx];
    if (colType === 'currency' || colType === 'number') {
      const n = parseFloat(String(value).replace(/[,$%]/g, ''));
      if (!isNaN(n) && n < 0) return 'text-red-400';
      if (!isNaN(n) && n > 0) return 'text-emerald-400';
    }
    return 'text-zinc-300';
  };

  // Download as CSV
  const downloadCSV = () => {
    if (!generatedData) return;
    const sheet = generatedData.sheets[activeSheet];
    const allRows = [sheet.headers, ...sheet.rows];
    if (sheet.totals?.row) allRows.push(sheet.totals.row);
    const csv = allRows.map((row: any[]) =>
      row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedData.filename?.replace('.xlsx', '.csv') || 'imperium_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download all sheets as JSON (for actual XLSX conversion)
  const downloadJSON = () => {
    if (!generatedData) return;
    const json = JSON.stringify(generatedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedData.filename?.replace('.xlsx', '.json') || 'imperium_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSheet = generatedData?.sheets?.[activeSheet];
  const displayRows = currentSheet
    ? getFilteredRows(getSortedRows(currentSheet.rows || []), currentSheet.headers || [])
    : [];

  return (
    <div className="h-full flex flex-col gap-5 p-3 md:p-6 overflow-y-auto bg-black"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-amber-900/20">
        <div>
          <h2 className="text-3xl font-bold text-amber-400 font-['Cinzel'] tracking-wider">
            {t.excel?.title || 'Excel Generator'}
          </h2>
          <p className="text-zinc-500 mt-1 text-sm">{t.excel?.subtitle || 'AI-powered spreadsheet architect'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold tracking-wider">
            GEMINI PRO
          </div>
          <FileSpreadsheet className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Template Search & Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                !filterCategory ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              ALL
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                  filterCategory === cat ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {filteredTemplates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleGenerate(tpl.prompt)}
              disabled={isGenerating}
              className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-left hover:border-amber-500/40 hover:bg-zinc-900 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-xl mb-1">{tpl.icon}</div>
              <div className="text-[11px] font-bold text-zinc-300 group-hover:text-amber-400 transition-colors leading-tight">{tpl.label}</div>
              <div className="mt-1 text-[9px] text-zinc-600 uppercase tracking-wider">{tpl.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder={t.excel?.placeholder || 'Describe your spreadsheet...'}
          className="flex-1 px-5 py-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-zinc-200 placeholder-zinc-600 text-sm"
        />
        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt.trim()}
          className="px-6 py-3.5 bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-30 flex items-center gap-2 transition-all whitespace-nowrap"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {t.excel?.generate || 'Generate'}
        </button>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <div className="bg-zinc-950 rounded-2xl border border-amber-900/30 p-6 flex flex-col items-center gap-4">
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-amber-400 text-sm font-['Cinzel'] animate-pulse">{progressMsg}</p>
            <p className="text-zinc-600 text-xs mt-1">{progress}% complete</p>
          </div>
          <div className="grid grid-cols-5 gap-2 w-full max-w-xs">
            {['Schema', 'Headers', 'Rows', 'Formulas', 'Style'].map((step, i) => (
              <div key={i} className="text-center">
                <div className={`w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs transition-all ${
                  progress > i * 20 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-600'
                }`}>
                  {progress > (i + 1) * 20 ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[8px] text-zinc-600 uppercase tracking-wider">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {generatedData && !isGenerating && (
        <div className="flex-1 bg-zinc-950 rounded-2xl border border-amber-900/30 overflow-hidden flex flex-col min-h-0">

          {/* File Info Bar */}
          <div className="px-5 py-3 bg-zinc-900/80 border-b border-amber-900/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-amber-200">{generatedData.filename}</p>
                {generatedData.description && (
                  <p className="text-[10px] text-zinc-600">{generatedData.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded-lg">
                {generatedData.sheets?.length} sheet{generatedData.sheets?.length > 1 ? 's' : ''}
              </span>
              <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-1 rounded-lg">
                {currentSheet?.rows?.length || 0} rows
              </span>
            </div>
          </div>

          {/* KPIs Section */}
          {currentSheet?.kpis?.length > 0 && (
            <div>
              <button
                onClick={() => setShowKpis(!showKpis)}
                className="w-full flex items-center justify-between px-5 py-2 bg-zinc-900/40 border-b border-zinc-800/50 text-[10px] text-amber-500/60 uppercase tracking-widest hover:bg-zinc-900/60 transition-colors"
              >
                <span className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> KEY METRICS</span>
                {showKpis ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showKpis && (
                <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 border-b border-zinc-800/50">
                  {currentSheet.kpis.map((kpi: any, i: number) => (
                    <KpiCard key={i} label={kpi.label} value={kpi.value} trend={kpi.trend} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sheet Tabs + Actions */}
          <div className="flex items-center justify-between bg-zinc-900/60 border-b border-amber-900/20 px-3">
            <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {generatedData.sheets?.map((sheet: any, i: number) => (
                <button
                  key={i}
                  onClick={() => { setActiveSheet(i); setSortCol(null); }}
                  className={`px-5 py-3 text-[11px] font-bold tracking-wide border-b-2 transition-all whitespace-nowrap ${
                    activeSheet === i
                      ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 px-2">
              {/* Row Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Filter rows..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-7 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-[10px] text-zinc-300 w-32 focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold rounded-lg hover:bg-amber-900/20 transition-all"
              >
                <Download className="w-3 h-3" />
                CSV
              </button>
              <button
                onClick={downloadJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold rounded-lg hover:bg-zinc-700 transition-all"
              >
                <Download className="w-3 h-3" />
                JSON
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1 p-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
            {currentSheet && (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 bg-zinc-900 border-b border-r border-zinc-800 text-zinc-600 text-[10px] w-8 text-center">#</th>
                    {currentSheet.headers?.map((h: string, i: number) => (
                      <th
                        key={i}
                        onClick={() => handleSort(i)}
                        className="px-4 py-3 bg-zinc-900 text-amber-400 border-b border-r border-zinc-800 text-left font-bold tracking-wide whitespace-nowrap cursor-pointer hover:bg-amber-900/10 transition-colors group/th select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span>{h}</span>
                          <span className="opacity-0 group-hover/th:opacity-100 transition-opacity">
                            {sortCol === i
                              ? (sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)
                              : <SortAsc className="w-3 h-3 text-zinc-600" />
                            }
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row: any[], ri: number) => (
                    <tr
                      key={ri}
                      className={`group/row hover:bg-amber-900/5 transition-colors ${
                        ri % 2 === 0 ? 'bg-zinc-800/10' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-3 py-2.5 text-zinc-700 border-b border-r border-zinc-800/50 text-center text-[9px] font-mono">
                        {ri + 1}
                      </td>
                      {row.map((cell: any, ci: number) => (
                        <td
                          key={ci}
                          className={`px-4 py-2.5 border-b border-r border-zinc-800/50 whitespace-nowrap font-mono ${getCellColor(cell, ci, currentSheet)}`}
                        >
                          {formatCell(cell, ci, currentSheet)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Totals Row */}
                  {currentSheet.totals?.row && (
                    <tr className="bg-amber-900/15 border-t-2 border-amber-900/30">
                      <td className="px-3 py-3 text-amber-500 font-bold text-[10px] text-center border-r border-zinc-800">Σ</td>
                      {currentSheet.totals.row.map((cell: any, ci: number) => (
                        <td key={ci} className="px-4 py-3 text-amber-300 font-bold border-r border-zinc-800 whitespace-nowrap font-mono">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Stats Bar */}
          {currentSheet?.rows && <StatsBar data={currentSheet.rows} />}

          {/* Formulas Section */}
          {currentSheet?.formulas?.length > 0 && (
            <div className="px-4 py-3 border-t border-zinc-800/50">
              <p className="text-[10px] uppercase tracking-widest text-amber-500/50 mb-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Formulas ({currentSheet.formulas.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentSheet.formulas.map((f: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-700/60 rounded-lg">
                    <span className="text-amber-500 font-mono font-bold text-[10px]">{f.cell}:</span>
                    <span className="text-zinc-400 font-mono text-[10px]">{f.formula}</span>
                    {f.description && <span className="text-zinc-600 text-[9px]">• {f.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Info */}
          {currentSheet?.charts?.length > 0 && (
            <div className="px-4 py-3 border-t border-zinc-800/50">
              <p className="text-[10px] uppercase tracking-widest text-amber-500/50 mb-2 flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3" /> Charts
              </p>
              <div className="flex flex-wrap gap-2">
                {currentSheet.charts.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700/60 rounded-xl">
                    <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] text-zinc-300 font-bold">{c.title}</span>
                    <span className="text-[9px] text-zinc-600 uppercase">{c.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
