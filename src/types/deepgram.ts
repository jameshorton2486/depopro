
export interface DeepgramKeyterm {
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
}

export interface TranscriptFormatting {
  timestampFormat?: string;
  enableDiarization?: boolean;
  enableParagraphs?: boolean;
  removeExtraSpaces?: boolean;
  standardizePunctuation?: boolean;
  boldSpeakerNames?: boolean;
  highlightFillerWords?: boolean;
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
  formatting?: TranscriptFormatting;
  utteranceThreshold?: number;
  utterances?: boolean;
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
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        confidence: number;
        words: Array<{
          word: string;
          start: number;
          end: number;
          confidence: number;
        }>;
        paragraphs?: {
          paragraphs: DeepgramParagraph[];
        };
      }>;
    }>;
  };
}
