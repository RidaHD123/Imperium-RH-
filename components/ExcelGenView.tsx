import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { TableProperties, Download, Loader2, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface ExcelGenViewProps {
  lang: Language;
}

const EXCEL_SYSTEM_PROMPT = `
You are an expert Excel/spreadsheet architect. When asked to create an Excel file, you respond ONLY with a valid JSON object describing the complete spreadsheet structure. No explanation, no markdown, just pure JSON.

The JSON structure must follow this exact format:
{
  "filename": "name_of_file.xlsx",
  "sheets": [
    {
      "name": "Sheet Name",
      "headers": ["Column A", "Column B", "Column C"],
      "rows": [
        ["value1", "value2", "value3"],
        ["value4", "value5", "value6"]
      ],
      "formulas": [
        { "cell": "D2", "formula": "=A2*B2" },
        { "cell": "D3", "formula": "=SUM(D2:D10)" }
      ],
      "charts": [
        {
          "type": "bar",
          "title": "Chart Title",
          "dataRange": "A1:C10"
        }
      ],
      "styling": {
        "headerColor": "#1a1a2e",
        "alternateRows": true,
        "boldHeaders": true,
        "numberFormat": { "columns": [2, 3], "format": "€#,##0.00" }
      }
    }
  ]
}

For financial models: include 5-year projections with formulas. For dashboards: include multiple sheets. For business plans: include P&L, Balance Sheet, Cash Flow, and KPI sheets. Always use realistic sample data. Never return anything except the JSON object.
`;

export const ExcelGenView: React.FC<ExcelGenViewProps> = ({ lang }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const t = translations[lang];

  const QUICK_TEMPLATES = [
    { label: '5-Year Financial Model', prompt: 'Create a complete 5-year financial model for a SaaS startup with revenue projections, costs, EBITDA, and cash flow. Include realistic growth rates and investor metrics (ARR, MRR, Churn, LTV/CAC).' },
    { label: 'Business Plan Budget', prompt: 'Create a complete business plan budget with: Operating Expenses sheet, Revenue Projections sheet, Break-Even Analysis sheet, and a Dashboard summary sheet with KPIs.' },
    { label: 'Project Management', prompt: 'Create a project management tracker with tasks, timeline (Gantt), resources, budget tracking, and risk register across multiple sheets.' },
    { label: 'HR Payroll System', prompt: 'Create a complete HR payroll system with employee database, salary calculations, tax deductions, leave tracking, and monthly payroll summary.' },
    { label: 'Investment Portfolio', prompt: 'Create an investment portfolio tracker with asset allocation, performance metrics, dividend tracking, risk analysis, and rebalancing calculator.' },
    { label: 'Sales Dashboard', prompt: 'Create a sales performance dashboard with monthly targets vs actuals, product analysis, regional breakdown, sales funnel metrics, and commission calculations.' },
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt) return;
    
    setIsGenerating(true);
    setGeneratedData(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        config: {
          systemInstruction: EXCEL_SYSTEM_PROMPT,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || '{}';
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanText);
      setGeneratedData(data);
      setActiveSheet(0);
    } catch (error) {
      console.error("Excel generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCSV = () => {
    if (!generatedData) return;
    const sheet = generatedData.sheets[activeSheet];
    const rows = [sheet.headers, ...sheet.rows];
    const csv = rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedData.filename?.replace('.xlsx', '.csv') || 'imperium_data.csv';
    a.click();
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-amber-900/20">
        <div>
          <h2 className="text-3xl font-bold text-gold-shiny font-['Cinzel']">{t.excel.title}</h2>
          <p className="text-zinc-500 mt-1">{t.excel.subtitle}</p>
        </div>
        <TableProperties className="w-8 h-8 text-amber-500" />
      </div>

      {/* Quick Templates */}
      <div>
        <p className="text-xs uppercase tracking-widest text-amber-500/50 mb-3">{t.excel.templates}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              onClick={() => handleGenerate(tpl.prompt)}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg hover:border-amber-500/50 hover:text-amber-400 transition-all"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div className="flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder={t.excel.placeholder}
          className="flex-1 px-6 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-zinc-200 placeholder-zinc-600"
        />
        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating || !prompt}
          className="px-8 py-4 bg-gold-shiny text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-30 flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {t.excel.generate}
        </button>
      </div>

      {/* Preview Table */}
      {isGenerating && (
        <div className="flex-1 bg-zinc-950 rounded-2xl border border-amber-900/30 flex items-center justify-center min-h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-amber-500/80 font-['Cinzel']">{t.excel.loading}</p>
          </div>
        </div>
      )}

      {generatedData && !isGenerating && (
        <div className="flex-1 bg-zinc-950 rounded-2xl border border-amber-900/30 overflow-hidden flex flex-col">
          {/* Sheet Tabs + Download */}
          <div className="flex items-center justify-between bg-zinc-900 border-b border-amber-900/20 px-4">
            <div className="flex">
              {generatedData.sheets?.map((sheet: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveSheet(i)}
                  className={`px-6 py-3 text-xs font-bold tracking-wide border-b-2 transition-all ${
                    activeSheet === i
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {sheet.name}
                </button>
              ))}
            </div>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs rounded-lg hover:bg-amber-900/20 transition-all"
            >
              <Download className="w-3 h-3" />
              {t.excel.download}
            </button>
          </div>

          {/* Table Preview */}
          <div className="overflow-auto flex-1 p-4">
            {generatedData.sheets?.[activeSheet] && (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    {generatedData.sheets[activeSheet].headers?.map((h: string, i: number) => (
                      <th key={i} className="px-4 py-3 bg-amber-900/20 text-amber-400 border border-zinc-800 text-left font-bold tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {generatedData.sheets[activeSheet].rows?.map((row: any[], ri: number) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-zinc-800/20' : 'bg-transparent'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-zinc-300 border border-zinc-800/50 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Show formulas if any */}
            {generatedData.sheets?.[activeSheet]?.formulas?.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-amber-500/50 mb-3">Formulas</p>
                <div className="flex flex-wrap gap-2">
                  {generatedData.sheets[activeSheet].formulas.map((f: any, i: number) => (
                    <span key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs rounded font-mono">
                      {f.cell}: {f.formula}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
