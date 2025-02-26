
export interface DeepgramKeyterm {
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
}

export interface TranscriptFormatting {
  timestampFormat?: string;
  enableDiarization?: boolean;
  enableParagraphs?: boolean;
}

export interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  diarize: boolean;
  punctuate: boolean;
  filler_words: boolean;
  paragraphs: boolean;
  keyterms?: DeepgramKeyterm[];
  formatting?: TranscriptFormatting;
}

export interface DeepgramSentence {
  text: string;
  start: number;
  end: number;
}

export interface DeepgramParagraph {
  speaker: number;
  start: number;
  end: number;
  sentences: DeepgramSentence[];
}

export interface TranscriptionResult {
  transcript: string;
  paragraphs?: DeepgramParagraph[];
  metadata?: {
    processingTime: number;
    audioLength: number;
    speakers?: number;
  };
}
