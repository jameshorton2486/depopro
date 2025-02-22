
export interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  diarize: boolean;
  punctuate: boolean;
  filler_words: boolean;
  paragraphs: boolean;
}

export interface TranscriptionResult {
  transcript: string;
}

// Add explicit type for the processAudioChunk function
export type ProcessAudioChunkFn = (
  buffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions
) => Promise<TranscriptionResult>;
