
export interface DeepgramKeyterm {
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
}

export interface TranscriptFormatting {
  timestampFormat?: string;       // e.g., "HH:mm:ss"
  boldSpeakerNames?: boolean;     // whether speaker names should be bold
  highlightFillerWords?: boolean; // apply a highlight style to filler words
  removeExtraSpaces?: boolean;    // clean up extra whitespace
  standardizePunctuation?: boolean; // ensure consistent punctuation spacing
  enableDiarization?: boolean;    // enable speaker diarization
  enableParagraphs?: boolean;     // enable paragraph formatting
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
  utterances?: boolean;
  utteranceThreshold?: number;
  keywords?: string[];
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

export interface DeepgramMetadata {
  request_id: string;
  transaction_key: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
  processing_time: number;
}

export interface DeepgramResponse {
  metadata: DeepgramMetadata;
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
          speaker?: number;
          punctuated_word?: string;
        }>;
        paragraphs?: {
          transcript: string;
          paragraphs: DeepgramParagraph[];
        };
      }>;
    }>;
  };
}

export interface TranscriptionResult {
  transcript: string;
  paragraphs?: DeepgramParagraph[];
  metadata?: {
    processingTime: number;
    audioLength: number;
    speakers?: number;
    fillerWords?: number;
  };
}

export type ProcessAudioChunkFn = (
  buffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions
) => Promise<TranscriptionResult>;
