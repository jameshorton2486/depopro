
import { DeepgramOptions } from "@/types/deepgram";

export const enforceOptions = (userOptions: Partial<DeepgramOptions>): DeepgramOptions => ({
  ...userOptions,
  diarize: true,
  punctuate: true,
  smart_format: true,
  paragraphs: true,
  filler_words: true,
  utterances: true,
  model: userOptions.model || "nova-meeting",
  language: userOptions.language || "en-US",
  formatting: {
    timestampFormat: "HH:mm:ss",
    enableDiarization: true,
    enableParagraphs: true,
    removeExtraSpaces: true,
    standardizePunctuation: true,
    boldSpeakerNames: true,
    highlightFillerWords: true,
    ...userOptions.formatting
  }
});

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
    enableDiarization: true,
    enableParagraphs: true,
    removeExtraSpaces: true,
    standardizePunctuation: true,
    boldSpeakerNames: true,
    highlightFillerWords: true
  }
};
