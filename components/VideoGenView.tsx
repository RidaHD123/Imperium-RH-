
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from '../utils';
import { Video, Upload, Film, Play, Loader2, Key, Clapperboard } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface VideoGenViewProps {
  lang: Language;
}

export const VideoGenView: React.FC<VideoGenViewProps> = ({ lang }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [hasKey, setHasKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const has = await window.aistudio.hasSelectedApiKey();
      setHasKey(has);
    } else {
        setHasKey(true);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        await checkKey();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setSelectedImage(base64);
      setGeneratedVideoUrl(null);
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedImage && !prompt) return;
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    setIsGenerating(true);
    setGeneratedVideoUrl(null);

    try {
      let operation;
      
      if (selectedImage) {
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt || "Cinematic shot",
            image: {
                imageBytes: selectedImage,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
          });
      } else {
          operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
          });
      }

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const uri = operation.response.generatedVideos[0].video.uri;
        const finalUrl = `${uri}&key=${process.env.API_KEY}`;
        setGeneratedVideoUrl(finalUrl);
      } else {
          throw new Error("No video URI in response");
      }

    } catch (error) {
      console.error("Veo Error:", error);
      alert("Erreur lors de la génération vidéo.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasKey) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-black">
              <div className="bg-zinc-900 p-10 rounded-3xl shadow-2xl max-w-md border border-amber-500/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gold-shiny"></div>
                  <Key className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-3 text-amber-100 font-['Cinzel']">{t.video.accessDenied}</h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed">{t.video.accessDesc}</p>
                  <button 
                    onClick={handleSelectKey}
                    className="bg-gold-shiny text-black px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-transform hover:scale-105"
                  >
                      {t.video.authBtn}
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="h-full flex flex-col gap-6 p-2 md:p-6 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-amber-900/20 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gold-shiny font-['Cinzel']">{t.video.title}</h2>
          <p className="text-zinc-500 mt-1">{t.video.subtitle}</p>
        </div>
        <Clapperboard className="w-8 h-8 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Controls */}
        <div className="lg:col-span-4 bg-zinc-950 p-6 rounded-3xl border border-amber-900/30 shadow-2xl flex flex-col gap-6 h-fit">
            
            {/* Image Input */}
            <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-amber-500/70 mb-3">{t.video.refImage}</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-40 relative overflow-hidden ${
                    selectedImage ? 'border-amber-500/50 bg-amber-900/10' : 'border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900'
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
                        <img src={`data:image/png;base64,${selectedImage}`} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    ) : (
                        <div className="text-center">
                            <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.video.uploadRef}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input */}
            <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-amber-500/70 mb-3">{t.video.scenario}</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.video.scenarioPlaceholder}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-200 h-32 resize-none placeholder-zinc-600"
                />
            </div>

            {/* Config */}
            <div>
                 <label className="block text-xs uppercase tracking-widest font-bold text-amber-500/70 mb-3">{t.video.ratio}</label>
                 <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setAspectRatio('16:9')}
                        className={`py-3 rounded-xl border text-xs font-bold tracking-wider transition-all ${aspectRatio === '16:9' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                     >
                         {t.video.landscape}
                     </button>
                     <button 
                        onClick={() => setAspectRatio('9:16')}
                        className={`py-3 rounded-xl border text-xs font-bold tracking-wider transition-all ${aspectRatio === '9:16' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                     >
                         {t.video.portrait}
                     </button>
                 </div>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={isGenerating || (!prompt && !selectedImage)}
              className="w-full py-4 bg-gold-shiny text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
              {t.video.btnProduce}
            </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 bg-black rounded-3xl overflow-hidden flex items-center justify-center relative shadow-2xl min-h-[500px] border border-zinc-800">
            {/* Decoration lines */}
            <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-amber-500/20 rounded-tl-3xl"></div>
            <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-amber-500/20 rounded-br-3xl"></div>

            {isGenerating ? (
                <div className="text-center text-amber-500">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                         <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-ping"></div>
                         <div className="absolute inset-2 border border-amber-500/40 rounded-full animate-pulse"></div>
                         <Loader2 className="w-full h-full animate-spin p-8" />
                    </div>
                    <h3 className="text-2xl font-['Cinzel'] text-gold-shiny mb-3">{t.video.generating}</h3>
                    <p className="text-zinc-500 text-sm tracking-widest uppercase">{t.video.rendering}</p>
                </div>
            ) : generatedVideoUrl ? (
                <video 
                    src={generatedVideoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full object-contain bg-black"
                />
            ) : (
                <div className="text-zinc-600 flex flex-col items-center">
                    <Video className="w-24 h-24 mb-6 opacity-10" />
                    <p className="text-sm uppercase tracking-[0.2em] opacity-30 font-bold">{t.video.waiting}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
