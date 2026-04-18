export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  LIVE = 'LIVE',
  EXCEL = 'EXCEL',
  DOCS = 'DOCS'
}

export type Language = 'fr' | 'ar' | 'en' | 'de' | 'es' | 'no';

export type DocumentType = 'feasibility' | 'business_plan' | 'financial_report' | 'hr_report' |
  'strategic_plan' | 'audit_report' | 'market_study' | 'legal_doc' | 'technical_spec' |
  'project_plan' | 'executive_summary' | 'contract' | 'proposal' | 'minutes' | 'policy';

export interface Artifact {
  id: string;
  type: 'code' | 'markdown' | 'report' | 'feasibility' | 'data' | 'document';
  title: string;
  content: string;
  language?: string;
  pages?: number;
  wordCount?: number;
  createdAt?: Date;
}

export interface Attachment {
  name: string;
  type: string;
  data: string;
  isImage: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
  attachments?: Attachment[];
  artifact?: Artifact;
  timestamp?: Date;
}

export interface AudioBlob {
  data: string;
  mimeType: string;
}

export interface DocTemplate {
  id: DocumentType;
  icon: string;
  titleKey: string;
  descKey: string;
  color: string;
  minPages: number;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    readonly aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
  }
}
