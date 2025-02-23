
export interface DeepgramKeyterm {
  term: string;
  boost: number;
  category: 'legal' | 'medical' | 'other';
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
  };
}

export type ProcessAudioChunkFn = (
  buffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions
) => Promise<TranscriptionResult>;
