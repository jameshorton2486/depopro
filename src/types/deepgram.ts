
export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  type?: 'filler';
}

export interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  punctuate: boolean;
  diarize: boolean;
  diarize_version?: string;
  filler_words: boolean;
  detect_language: boolean;
}
