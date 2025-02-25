
import { DeepgramOptions } from "@/types/deepgram";

export const defaultTranscriptionOptions: DeepgramOptions = {
  model: "nova-meeting",
  language: "en-US",
  smart_format: true,
  diarize: true,
  punctuate: true,
  filler_words: true,
  paragraphs: true,
  utterances: true,
  utteranceThreshold: 0.2,
  keywords: [],
  keyterms: [],
  formatting: {
    timestampFormat: "HH:mm:ss",
    boldSpeakerNames: true,
    highlightFillerWords: true,
    removeExtraSpaces: true,
    standardizePunctuation: true,
    enableDiarization: true,
    enableParagraphs: true
  }
};

