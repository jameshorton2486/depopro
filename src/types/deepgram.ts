
export interface DeepgramKeyterm {
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
}

export type TranscriptFormattingOption = 'timestampFormat' | 'enableDiarization' | 'enableParagraphs' | 'removeExtraSpaces' | 'standardizePunctuation' | 'boldSpeakerNames' | 'highlightFillerWords';

export interface TranscriptFormatting {
  timestampFormat: 'HH:mm:ss' | 'mm:ss' | 'seconds';
  enableDiarization: boolean;
  enableParagraphs: boolean;
  removeExtraSpaces: boolean;
  standardizePunctuation: boolean;
  boldSpeakerNames: boolean;
  highlightFillerWords: boolean;
}

export interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  diarize: boolean;
  punctuate: boolean;
  filler_words: boolean;
  paragraphs: boolean;
  keywords?: string[];
  keyterms?: DeepgramKeyterm[];
  formatting: TranscriptFormatting;
  utteranceThreshold?: number;
  utterances?: boolean;
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export interface DeepgramSentence {
  text: string;
  start: number;
  end: number;
  words: DeepgramWord[];
}

export interface DeepgramParagraph {
  speaker: number;
  start: number;
  end: number;
  sentences: DeepgramSentence[];
}

export interface DeepgramMetadata {
  processingTime: number;
  audioLength: number;
  speakers?: number;
  fillerWords?: number;
}

export interface TranscriptionResult {
  transcript: string;
  paragraphs?: DeepgramParagraph[];
  metadata?: DeepgramMetadata;
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  paragraphs?: {
    paragraphs: DeepgramParagraph[];
  };
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramResponse {
  metadata: {
    transaction_key: string;
    request_id: string;
    sha256: string;
    created: string;
    duration: number;
    channels: number;
    processing_time: number;
  };
  results: {
    channels: DeepgramChannel[];
  };
}
