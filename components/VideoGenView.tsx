import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64 } from '../utils';
import {
  Video, Wand2, Upload, Download, Loader2, Sparkles,
  Play, Pause, Volume2, VolumeX, Maximize2, X,
  Clock, Monitor, Smartphone, Film, Grid, RefreshCw,
  Trash2, Eye, Share2, Star, Zap, Layers, AlertCircle
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface VideoGenViewProps {
  lang: Language;
}

interface GeneratedVideo {
  id: string;
  videoUrl: string;
  prompt: string;
  timestamp: Date;
  status: 'processing' | 'completed' | 'failed';
  ratio: string;
}

const VIDEO_TEMPLATES = [
  {
    label: "Magic Genie",
    prompt: "A cute and magical golden Aladdin's lamp on a dark elegant background, the famous blue Genie from Aladdin (Disney style, muscular, big smile, energetic personality) is emerging smoothly from the lamp's spout in a swirl of sparkling blue smoke and golden sparks. The Genie is moving happily: waving his hands, nodding his head, and dancing slightly in a fun loop. Magical glowing particles and stars floating around, vibrant colors, cinematic lighting, smooth animation, seamless loop, high quality 4K, cheerful and entertaining mood, perfect for loading screen animation.",
    icon: "🧞‍♂️"
  },
  {
    label: "Cinematic Drone",
    prompt: "Cinematic drone shot flying over a lush tropical island with crystal clear turquoise water, white sand beaches, and deep green palm trees at sunset. 4K, realistic, highly detailed.",
    icon: "🏝️"
  },
  {
    label: "Cyberpunk City",
    prompt: "First-person view flying through a futuristic cyberpunk city with neon neon lights, holographic billboards, and flying cars in the rain at night. Hyper-realistic, 8K.",
    icon: "🌆"
  },
  {
    label: "Magic Forest",
    prompt: "A slow camera move through an enchanted bioluminescent forest with glowing plants, mystical creatures, and floating dust particles. Ethereal, fantasy style, 4K.",
    icon: "✨"
  },
  {
    label: "Abstract Flow",
    prompt: "Mesmerizing abstract 3D movement of liquid gold and silk flowing together in zero gravity. Smooth transitions, elegant lighting, luxurious feel.",
    icon: "🌀"
  },
  {
    label: "Space Odyssey",
    prompt: "Cinematic approach to a massive interstellar nebula with swirling colorful gases, distant stars, and a futuristic spacecraft entering hyperspace.",
    icon: "🌌"
  }
];

const RATIOS = [
  { label: 'Widescreen', value: '16:9', icon: <Monitor className="w-4 h-4" /> },
  { label: 'Portrait', value: '9:16', icon: <Smartphone className="w-4 h-4" /> },
  { label: 'Square', value: '1:1', icon: <Grid className="w-4 h-4" /> },
];

export const VideoGenView: React.FC<VideoGenViewProps> = ({ lang }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const base64 = await fileToBase64(e.target.files[0]);
      setSelectedImage(base64);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedImage) return;

    setIsGenerating(true);
    const videoId = Date.now().toString();

    // Create a temporary video record with processing state
    const newVideo: GeneratedVideo = {
      id: videoId,
      videoUrl: '',
      prompt: prompt,
      timestamp: new Date(),
      status: 'processing',
      ratio: selectedRatio
    };
    setVideos(prev => [newVideo, ...prev]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const parts: any[] = [];
      if (selectedImage) {
        parts.push({ inlineData: { mimeType: 'image/png', data: selectedImage } });
      }
      parts.push({ text: `IMPERIUM CINEMATIC ENGINE: Generate a world-class, professional, smart, and powerful cinematic achievement of the highest quality. ${prompt} (Resolution: 1080p, Aspect Ratio: ${selectedRatio})` });

      // Use the preview model for higher quality
      const response = await ai.models.generateContent({
        model: 'veo-3.1-generate-preview',
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: ['VIDEO'],
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const videoUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            setVideos(prev => prev.map(v =>
              v.id === videoId ? { ...v, videoUrl, status: 'completed' } : v
            ));
            setIsGenerating(false);
            return;
          }
        }
      }
      throw new Error('No video data generated');
    } catch (error: any) {
      console.error('Video generation error:', error);
      setVideos(prev => prev.map(v =>
        v.id === videoId ? { ...v, status: 'failed' } : v
      ));

      // Friendly alert
      if (error.message?.includes('404')) {
        alert("The video model is currently initializing. Please try again in 1-2 minutes.");
      } else {
        alert("An error occurred during video generation. Please check your API key.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = (video: GeneratedVideo) => {
    const a = document.createElement('a');
    a.href = video.videoUrl;
    a.download = `imperium-video-${video.id}.mp4`;
    a.click();
  };

  const deleteVideo = (id: string) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="h-full flex flex-col gap-6 p-4 md:p-8 bg-black overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}>

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-amber-900/20">
        <div>
          <h2 className="text-3xl font-bold text-amber-400 font-['Cinzel'] tracking-wider flex items-center gap-3">
            <Video className="w-8 h-8 text-amber-500" />
            {t.video?.title || 'World-Class Video Engine'}
          </h2>
          <p className="text-zinc-500 mt-1 text-sm">{t.video?.subtitle || 'AI cinematics from text or images'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs font-bold tracking-widest">
            VEO 3.1 PREVIEW
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">

          {/* Featured Templates */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-amber-500/60 mb-3 flex items-center gap-2">
              <Star className="w-3 h-3" /> Featured Blueprints
            </p>
            <div className="grid grid-cols-1 gap-2">
              {VIDEO_TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(tmpl.prompt)}
                  className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-left hover:border-amber-500/40 hover:bg-zinc-900 transition-all group"
                >
                  <span className="text-2xl">{tmpl.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-300 group-hover:text-amber-400 transition-colors truncate">{tmpl.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ratio Selection */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-3">Aspect Ratio</p>
            <div className="grid grid-cols-3 gap-2">
              {RATIOS.map(ratio => (
                <button
                  key={ratio.value}
                  onClick={() => setSelectedRatio(ratio.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    selectedRatio === ratio.value
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {ratio.icon}
                  <span className="text-[10px] font-bold">{ratio.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Section */}
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-3">Input Reference (Optional)</p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                selectedImage ? 'border-amber-500/50' : 'border-zinc-800 hover:border-amber-500/30'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              {selectedImage ? (
                <>
                  <img src={selectedImage} alt="Reference" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white bg-black/40 px-3 py-1 rounded-full">Change</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-zinc-600 mb-2" />
                  <span className="text-xs text-zinc-500">Image-to-Video</span>
                </>
              )}
            </div>
          </div>

          {/* Prompt Section */}
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 block">Visual Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the motion, scene, and cinematic style..."
              rows={5}
              className="w-full px-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl focus:outline-none focus:border-amber-500/40 text-zinc-200 placeholder-zinc-700 text-sm resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt.trim() && !selectedImage)}
              className="w-full py-4 bg-gradient-to-br from-amber-500 to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {t.video?.btnGenerate || 'Ignite Engine'}
            </button>
          </div>
        </div>

        {/* Right Column: Video Gallery / Display */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Generation */}
          {isGenerating && (
            <div className="aspect-video w-full bg-zinc-900/50 rounded-3xl border border-amber-500/20 flex flex-col items-center justify-center p-8 text-center animate-pulse">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-ping" />
                <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <h3 className="text-amber-400 font-['Cinzel'] text-xl mb-2">Rendering Masterpiece</h3>
              <p className="text-zinc-500 text-sm max-w-sm">Our world-class VEO engine is processing your motion sequence. This typically takes 30-60 seconds.</p>
            </div>
          )}

          {/* Video List */}
          <div className="grid grid-cols-1 gap-6">
            {videos.map(video => (
              <div key={video.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden group">
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  {video.status === 'completed' ? (
                    <video
                      src={video.videoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-contain"
                    />
                  ) : video.status === 'processing' ? (
                    <div className="flex flex-col items-center gap-4 text-amber-500/60">
                      <Loader2 className="w-10 h-10 animate-spin" />
                      <span className="text-xs uppercase tracking-widest font-bold">Processing Stream...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-red-500/60">
                      <AlertCircle className="w-10 h-10" />
                      <span className="text-xs uppercase tracking-widest font-bold">Generation Failed</span>
                    </div>
                  )}

                  {/* Top Bar Overlay */}
                  <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-black uppercase tracking-tighter">1080P HD</span>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="p-1.5 bg-black/60 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-zinc-900 border-t border-zinc-800">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-xs text-zinc-400 line-clamp-1 italic">"{video.prompt}"</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {video.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1 uppercase tracking-tighter">
                        <Monitor className="w-3 h-3" /> {video.ratio}
                      </span>
                    </div>
                  </div>
                  {video.status === 'completed' && (
                    <button
                      onClick={() => downloadVideo(video)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-all flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))}

            {videos.length === 0 && !isGenerating && (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-700">
                <Video className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-['Cinzel'] text-sm opacity-40">Your visual masterpieces will appear here</p>
                <div className="flex gap-4 mt-8">
                  {['Text-to-Video', 'Image-to-Video', 'Cinematics'].map(feat => (
                    <div key={feat} className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/50">
                      <Zap className="w-3 h-3 text-amber-500" /> {feat}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
