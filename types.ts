
export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE'
}

export type Language = 'fr' | 'ar' | 'en' | 'de' | 'es' | 'no';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
  image?: string; // Base64
}

export interface AudioBlob {
  data: string;
  mimeType: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
