
export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  type?: 'filler' | undefined;
}

export interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  punctuate: boolean;
  diarize: boolean;
  filler_words: boolean;
  detect_language: boolean;
}
