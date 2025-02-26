
import { useState } from "react";
import { DeepgramOptions } from "@/types/deepgram";

export const useDeepgramOptions = (initialOptions?: Partial<DeepgramOptions>) => {
  const [options] = useState<DeepgramOptions>({
    model: "nova-meeting",
    language: "en-US",
    smart_format: true,
    punctuate: true,
    diarize: true,
    filler_words: true,
    paragraphs: true,
    formatting: {
      timestampFormat: "HH:mm:ss",
      enableDiarization: true,
      enableParagraphs: true,
      removeExtraSpaces: true,
      standardizePunctuation: true,
      boldSpeakerNames: true,
      highlightFillerWords: true
    },
    ...initialOptions
  });

  return options;
};
