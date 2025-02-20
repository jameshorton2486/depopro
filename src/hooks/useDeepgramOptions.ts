
import { useState } from "react";
import { DeepgramOptions } from "@/types/deepgram";

export const useDeepgramOptions = () => {
  const [model, setModel] = useState<string>("nova-3");
  const [language, setLanguage] = useState<string>("en-US");
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-3",
    language: "en-US",
    smart_format: true,
    punctuate: true,
    diarize: true,
    utterances: true,
    filler_words: true,
    detect_language: true
  });

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
    if (newOptions.model) {
      setModel(newOptions.model);
    }
    if (newOptions.language) {
      setLanguage(newOptions.language);
    }
  };

  return {
    model,
    language,
    options,
    setModel,
    setLanguage,
    handleOptionsChange,
  };
};
