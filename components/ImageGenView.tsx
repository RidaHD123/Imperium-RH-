import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from '../utils';
import {
  Image as ImageIcon, Wand2, Upload, Download, Loader2, Sparkles,
  Trash2, RefreshCw, Copy, Check, ZoomIn, X, Plus, Maximize2,
  Grid, ChevronLeft, ChevronRight, Star, Palette, Layers,
  Sliders, Eye, Heart, Share2, Camera, Aperture
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface ImageGenViewProps {
  lang: Language;
}

interface GeneratedImage {
  id: string;
  imageData: string;
  prompt: string;
  style: string;
  timestamp: Date;
  liked: boolean;
  aspectRatio: string;
}

const STYLE_PRESETS = [
  { id: 'photorealistic', label: 'Photorealistic', icon: '📷', suffix: 'ultra-photorealistic, 8K, RAW photo, sharp focus, professional lighting' },
  { id: 'oil-painting', label: 'Oil Painting', icon: '🎨', suffix: 'oil painting style, rich textures, impasto technique, museum quality, Renaissance' },
  { id: 'anime', label: 'Anime', icon: '⛩️', suffix: 'anime style, vibrant colors, Studio Ghibli aesthetic, cel shading, detailed illustration' },
  { id: 'concept-art', label: 'Concept Art', icon: '🖌️', suffix: 'concept art, digital painting, cinematic, by Greg Rutkowski, artstation trending' },
  { id: 'minimalist', label: 'Minimalist', icon: '◻️', suffix: 'minimalist, clean lines, white space, geometric, modern design, flat illustration' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌆', suffix: 'cyberpunk aesthetic, neon lights, futuristic, dark atmosphere, rain, night city' },
  { id: 'watercolor', label: 'Watercolor', icon: '💧', suffix: 'watercolor painting, soft edges, translucent washes, artistic, delicate brushstrokes' },
  { id: 'fantasy', label: 'Dark Fantasy', icon: '⚔️', suffix: 'dark fantasy art, epic, dramatic lighting, intricate details, mystical atmosphere' },
  { id: '3d-render', label: '3D Render', icon: '💎', suffix: '3D render, Octane render, subsurface scattering, global illumination, CGI quality' },
  { id: 'impressionist', label: 'Impressionist', icon: '🌸', suffix: 'impressionist painting style, loose brushstrokes, vibrant palette, Monet-inspired' },
  { id: 'vintage', label: 'Vintage', icon: '📸', suffix: 'vintage photograph, film grain, aged colors, retro aesthetic, 1970s style' },
  { id: 'abstract', label: 'Abstract', icon: '🌀', suffix: 'abstract art, fluid shapes, bold colors, Kandinsky-inspired, dynamic composition' },
];

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', icon: '◼', desc: 'Square' },
  { label: '16:9', value: '16:9', icon: '▬', desc: 'Widescreen' },
  { label: '9:16', value: '9:16', icon: '▮', desc: 'Portrait' },
  { label: '4:3', value: '4:3', icon: '▩', desc: 'Classic' },
  { label: '3:2', value: '3:2', icon: '▭', desc: 'Photo' },
];

const QUICK_PROMPTS = [
  { label: 'Epic Dragon', prompt: 'An ancient dragon with golden scales soaring above snow-capped mountains at sunset' },
  { label: 'Luxury Villa', prompt: 'A breathtaking luxury villa in Santorini with infinity pool overlooking the caldera at golden hour' },
  { label: 'Futuristic City', prompt: 'A futuristic megacity with floating platforms, holographic billboards, and flying vehicles at night' },
  { label: 'Mystical Forest', prompt: 'An enchanted ancient forest with bioluminescent plants, giant trees, and magical floating orbs of light' },
  { label: 'Deep Ocean', prompt: 'The mysterious deep ocean with bioluminescent creatures, underwater ruins, and cosmic jellyfish' },
  { label: 'Space Station', prompt: 'A massive luxury space station orbiting Earth with panoramic windows showing the Milky Way' },
];

// ─── Lightbox ─────────────────────────────────────────────
const Lightbox: React.FC<{
  image: GeneratedImage;
  onClose: () => void;
  onDownload: (img: GeneratedImage) => void;
}> = ({ image, onClose, onDownload }) => (
  <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-all z-10"
    >
      <X className="w-5 h-5" />
    </button>
    <div className="max-w-4xl w-full flex flex-col items-center gap-4">
      <img
        src={`data:image/png;base64,${image.imageData}`}
        alt={image.prompt}
        className="max-h-[75vh] max-w-full rounded-2xl shadow-2xl object-contain"
      />
      <div className="flex items-center gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2 max-w-md">
          <p className="text-zinc-400 text-xs text-center line-clamp-2">{image.prompt}</p>
        </div>
        <button
          onClick={() => onDownload(image)}
          className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-amber-400 transition-all"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  </div>
);

// ─── Gallery Card ─────────────────────────────────────────
const GalleryCard: React.FC<{
  img: GeneratedImage;
  onOpen: () => void;
  onLike: () => void;
  onDelete: () => void;
  onDownload: () => void;
}> = ({ img, onOpen, onLike, onDelete, onDownload }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-zinc-800 group cursor-pointer aspect-square bg-zinc-900"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={`data:image/png;base64,${img.imageData}`}
        alt={img.prompt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-[10px] line-clamp-2 mb-2">{img.prompt}</p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); onOpen(); }}
              className="flex-1 py-1.5 bg-amber-500 text-black rounded-lg text-[10px] font-bold hover:bg-amber-400 transition-colors"
            >
              <Eye className="w-3 h-3 mx-auto" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onLike(); }}
              className={`p-1.5 rounded-lg text-[10px] border transition-colors ${img.liked ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-red-400'}`}
            >
              <Heart className={`w-3 h-3 ${img.liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDownload(); }}
              className="p-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-amber-400 rounded-lg transition-colors"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Style Badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-lg text-[9px] text-amber-400 border border-amber-900/30 font-bold uppercase tracking-wider">
        {img.style}
      </div>

      {/* Liked Badge */}
      {img.liked && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
          <Heart className="w-3 h-3 text-white fill-current" />
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
export const ImageGenView: React.FC<ImageGenViewProps> = ({ lang }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [lightboxImg, setLightboxImg] = useState<GeneratedImage | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generationCount, setGenerationCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const currentStyle = STYLE_PRESETS.find(s => s.id === selectedStyle);
  const likedCount = gallery.filter(g => g.liked).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setSelectedImage(base64);
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{
          role: 'user',
          parts: [{ text: `Enhance this image generation prompt to be more detailed, vivid, and visually rich. Keep the core concept but add cinematic lighting, composition details, mood, and quality terms. Return ONLY the enhanced prompt, no explanation:\n\n"${prompt}"` }]
        }]
      });
      const enhanced = result.text?.trim();
      if (enhanced) setPrompt(enhanced);
    } catch (err) {
      console.error('Enhance error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) return;

    setIsGenerating(true);
    setActiveTab('create');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const styleConfig = STYLE_PRESETS.find(s => s.id === selectedStyle);
      const fullPrompt = [
        prompt,
        styleConfig?.suffix,
        negativePrompt ? `(avoid: ${negativePrompt})` : ''
      ].filter(Boolean).join(', ');

      const parts: any[] = [];
      if (selectedImage) {
        parts.push({ inlineData: { mimeType: 'image/png', data: selectedImage } });
      }
      parts.push({ text: `IMPERIUM VISUAL ENGINE: Create a world-class, professional, smart, and powerful visual achievement. Extreme detail, hyper-realistic, sophisticated composition. Content: ${fullPrompt}` });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio as any,
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const newImg: GeneratedImage = {
              id: Date.now().toString(),
              imageData: part.inlineData.data,
              prompt: prompt,
              style: styleConfig?.label || 'Custom',
              timestamp: new Date(),
              liked: false,
              aspectRatio: selectedRatio,
            };
            setGallery(prev => [newImg, ...prev]);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      alert('Generation failed. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${img.imageData}`;
    a.download = `imperium-${img.style.toLowerCase()}-${Date.now()}.png`;
    a.click();
  };

  const toggleLike = (id: string) => {
    setGallery(prev => prev.map(img => img.id === id ? { ...img, liked: !img.liked } : img));
  };

  const deleteImage = (id: string) => {
    setGallery(prev => prev.filter(img => img.id !== id));
  };

  const latestImage = gallery[0];

  return (
    <div className="h-full flex flex-col gap-0 bg-black overflow-hidden">

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-700/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
        <div>
          <h2 className="text-2xl font-bold text-amber-400 font-['Cinzel'] tracking-wider flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            {t.image?.title || 'AI Image Studio'}
          </h2>
          <p className="text-zinc-500 mt-0.5 text-xs">{t.image?.subtitle || 'Transform imagination into reality'}</p>
        </div>
        <div className="flex items-center gap-3">
          {gallery.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500">
                {gallery.length} generated
              </span>
              {likedCount > 0 && (
                <span className="px-2.5 py-1 bg-red-950/30 border border-red-900/40 rounded-xl text-red-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-current" /> {likedCount}
                </span>
              )}
            </div>
          )}
          <div className="flex border border-zinc-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Camera className="w-3.5 h-3.5 inline mr-1.5" />Create
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 text-xs font-bold transition-all relative ${activeTab === 'gallery' ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Grid className="w-3.5 h-3.5 inline mr-1.5" />Gallery
              {gallery.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[8px] text-black font-black flex items-center justify-center">
                  {gallery.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>
        {activeTab === 'create' ? (
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

            {/* LEFT: Controls */}
            <div className="flex flex-col gap-5">

              {/* Source Image */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-36 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                  selectedImage ? 'border-amber-500/50' : 'border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900/30'
                }`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                {selectedImage ? (
                  <>
                    <img src={`data:image/png;base64,${selectedImage}`} className="absolute inset-0 w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold">Click to change</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedImage(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-2 group-hover:text-amber-500 transition-colors" />
                    <p className="text-xs text-zinc-500 font-medium">{t.image?.uploadTitle || 'Upload reference image'}</p>
                    <p className="text-[10px] text-zinc-700 mt-1 uppercase tracking-wider">{t.image?.uploadDesc || 'Optional • PNG, JPG, WebP'}</p>
                  </div>
                )}
              </div>

              {/* Style Selection */}
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-amber-500/70 mb-2">
                  <Palette className="w-3 h-3" /> Art Style
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-2 rounded-xl border text-center transition-all group/style ${
                        selectedStyle === style.id
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      <div className="text-lg mb-0.5">{style.icon}</div>
                      <div className="text-[8px] font-bold leading-tight">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-amber-500/70 mb-2">
                  <Aperture className="w-3 h-3" /> Aspect Ratio
                </label>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map(ratio => (
                    <button
                      key={ratio.value}
                      onClick={() => setSelectedRatio(ratio.value)}
                      className={`flex-1 py-2 rounded-xl border text-center transition-all ${
                        selectedRatio === ratio.value
                          ? 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-sm mb-0.5">{ratio.icon}</div>
                      <div className="text-[9px] font-bold">{ratio.label}</div>
                      <div className="text-[8px] text-zinc-600">{ratio.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Prompts */}
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-amber-500/70 mb-2 block">Quick Prompts</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(qp.prompt)}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] rounded-xl hover:border-amber-500/40 hover:text-amber-400 transition-all"
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={t.image?.promptPlaceholder || 'Describe your vision with rich detail...'}
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 text-zinc-200 placeholder-zinc-600 text-sm resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-[9px] text-zinc-600 font-mono">
                    {prompt.length}
                  </span>
                </div>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={e => setNegativePrompt(e.target.value)}
                  placeholder="Negative prompt (what to avoid)..."
                  className="w-full px-4 py-2.5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl text-zinc-400 placeholder-zinc-700 text-xs focus:outline-none focus:border-red-900/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={enhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-xl hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-30 transition-all text-sm"
                >
                  {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Enhance
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!prompt.trim() && !selectedImage)}
                  className="flex-1 py-3 bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {t.image?.btnGenerate || 'Generate Image'}</>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT: Preview */}
            <div className="flex flex-col gap-3">
              <div className="flex-1 bg-zinc-950 rounded-2xl border border-amber-900/30 overflow-hidden relative min-h-[400px] flex items-center justify-center">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative w-24 h-24">
                      <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping" />
                      <div className="absolute inset-2 border-2 border-amber-500/50 rounded-full animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-amber-400 font-['Cinzel'] text-lg animate-pulse">
                        {t.image?.loading || 'Creating your masterpiece...'}
                      </p>
                      <p className="text-zinc-600 text-xs mt-2">{currentStyle?.label} • {selectedRatio}</p>
                    </div>

                    {/* Style indicator dots */}
                    <div className="flex gap-2">
                      {['Composing', 'Rendering', 'Refining'].map((step, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-zinc-600">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : latestImage ? (
                  <>
                    <img
                      src={`data:image/png;base64,${latestImage.imageData}`}
                      alt="Generated"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                      <div>
                        <p className="text-white text-xs font-bold">{currentStyle?.label}</p>
                        <p className="text-zinc-400 text-[10px] truncate max-w-[200px]">{latestImage.prompt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLightboxImg(latestImage)}
                          className="p-2 bg-black/60 border border-zinc-700 text-zinc-300 rounded-xl hover:border-amber-500/40 hover:text-amber-400 transition-all"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadImage(latestImage)}
                          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all text-sm"
                        >
                          <Download className="w-4 h-4" />
                          {t.image?.download || 'Download'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-zinc-700">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-['Cinzel'] text-sm opacity-40">{t.image?.empty || 'Your creation will appear here'}</p>
                    <p className="text-xs opacity-20 mt-2">Choose a style and enter a prompt</p>
                  </div>
                )}
              </div>

              {/* Recent Mini Gallery */}
              {gallery.length > 1 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-500/50 mb-2">Recent Creations</p>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {gallery.slice(1, 6).map(img => (
                      <button
                        key={img.id}
                        onClick={() => setLightboxImg(img)}
                        className="w-16 h-16 rounded-xl overflow-hidden border-2 border-zinc-800 hover:border-amber-500/50 flex-shrink-0 transition-all"
                      >
                        <img src={`data:image/png;base64,${img.imageData}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Gallery Tab
          <div className="p-5">
            {gallery.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <Grid className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-['Cinzel'] text-sm opacity-40">No images yet</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-xl text-sm hover:bg-amber-500/20 transition-all"
                >
                  Create your first image
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-zinc-400 text-sm">{gallery.length} images • {likedCount} liked</p>
                  <button
                    onClick={() => { if (window.confirm('Clear entire gallery?')) setGallery([]); }}
                    className="text-zinc-600 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {gallery.map(img => (
                    <GalleryCard
                      key={img.id}
                      img={img}
                      onOpen={() => setLightboxImg(img)}
                      onLike={() => toggleLike(img.id)}
                      onDelete={() => deleteImage(img.id)}
                      onDownload={() => downloadImage(img)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <Lightbox
          image={lightboxImg}
          onClose={() => setLightboxImg(null)}
          onDownload={downloadImage}
        />
      )}
    </div>
  );
};
