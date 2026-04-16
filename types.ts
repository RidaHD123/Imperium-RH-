
export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE',
  EXCEL = 'EXCEL'
}

export type Language = 'fr' | 'ar' | 'en' | 'de' | 'es' | 'no';

export interface Artifact {
  id: string;
  type: 'code' | 'markdown' | 'report' | 'feasibility' | 'data';
  title: string;
  content: string;
  language?: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
  isImage: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
  attachments?: Attachment[];
  artifact?: Artifact;
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
