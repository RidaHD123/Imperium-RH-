
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from '../utils';
import { Image as ImageIcon, Wand2, Upload, Download, Loader2, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface ImageGenViewProps {
  lang: Language;
}

export const ImageGenView: React.FC<ImageGenViewProps> = ({ lang }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setSelectedImage(base64);
      setGeneratedImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const parts: any[] = [];
      
      if (selectedImage) {
        parts.push({
          inlineData: {
            mimeType: 'image/png', 
            data: selectedImage
          }
        });
        parts.push({ text: prompt });
      } else {
        parts.push({ text: prompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
             setGeneratedImage(part.inlineData.data);
             break;
          }
        }
      }
    } catch (error) {
      console.error("Image generation error", error);
      // Using fallback error text, usually fine to keep errors simple or add to translations if critical
      alert("Erreur lors de la création de l'œuvre.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 md:p-6 overflow-y-auto">
      <div className="flex items-center justify-between pb-4 border-b border-amber-900/20">
        <div>
          <h2 className="text-3xl font-bold text-gold-shiny font-['Cinzel']">{t.image.title}</h2>
          <p className="text-zinc-500 mt-1">{t.image.subtitle}</p>
        </div>
        <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        {/* Input Section */}
        <div className="bg-zinc-950 p-8 rounded-3xl border border-amber-900/30 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[300px] relative overflow-hidden group ${
              selectedImage ? 'border-amber-500/50 bg-amber-900/5' : 'border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            {selectedImage ? (
              <img 
                src={`data:image/png;base64,${selectedImage}`} 
                alt="Source" 
                className="absolute inset-0 w-full h-full object-contain p-4" 
              />
            ) : (
              <div className="text-center p-4 group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-zinc-900 border border-amber-900/30 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="font-medium text-amber-100 font-['Cinzel']">{t.image.uploadTitle}</p>
                <p className="text-xs text-zinc-600 mt-2 uppercase tracking-widest">{t.image.uploadDesc}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t.image.promptPlaceholder}
              className="flex-1 px-6 py-4 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-200 placeholder-zinc-600"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="px-8 py-4 bg-gold-shiny text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(180,83,9,0.4)]"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              <span className="hidden sm:inline">{t.image.btnGenerate}</span>
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-zinc-950 p-8 rounded-3xl border border-amber-900/30 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col">
            <h3 className="text-xs font-bold text-amber-500/50 uppercase tracking-[0.2em] mb-6 text-center">{t.image.resultTitle}</h3>
            <div className="flex-1 bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden relative min-h-[300px] border border-zinc-800">
              {isGenerating ? (
                 <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
                    <p className="text-amber-500/80 font-['Cinzel']">{t.image.loading}</p>
                 </div>
              ) : generatedImage ? (
                <>
                  <img 
                    src={`data:image/png;base64,${generatedImage}`} 
                    alt="Generated" 
                    className="w-full h-full object-contain" 
                  />
                  <a 
                    href={`data:image/png;base64,${generatedImage}`} 
                    download="imperium-creation.png"
                    className="absolute bottom-6 right-6 bg-black/80 backdrop-blur text-amber-500 border border-amber-500/30 px-6 py-3 rounded-xl shadow-xl font-medium hover:bg-black flex items-center gap-3 transition-all hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    {t.image.download}
                  </a>
                </>
              ) : (
                <div className="text-zinc-700 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-['Cinzel'] text-sm opacity-40">{t.image.empty}</p>
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
