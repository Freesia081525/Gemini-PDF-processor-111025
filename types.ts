
export interface Agent {
  name: string;
  prompt: string;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
}

export interface PageData {
  pageNumber: number;
  imageDataUrl: string;
}

export interface AnalysisResult {
  agentName: string;
  output: string;
  latency: number;
  provider: string;
  model: string;
}

export enum ProcessingState {
  IDLE,
  UPLOADING,
  RENDERING_PDF,
  PERFORMING_OCR,
  ANALYZING,
  COMPLETE,
  ERROR
}
