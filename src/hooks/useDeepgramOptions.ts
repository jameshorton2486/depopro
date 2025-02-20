
import { useState, useEffect } from "react";
import { DeepgramOptions } from "@/types/deepgram";

const DEFAULT_OPTIONS: DeepgramOptions = {
  model: "nova-3",
  language: "en-US",
  smart_format: true,
  punctuate: true,
  diarize: true,
  utterances: true,
  filler_words: true,
  detect_language: true
};

export const useDeepgramOptions = () => {
  const [model, setModel] = useState<string>(() => {
    const saved = localStorage.getItem('deepgram_model');
    return saved || DEFAULT_OPTIONS.model;
  });

  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem('deepgram_language');
    return saved || DEFAULT_OPTIONS.language;
  });

  const [options, setOptions] = useState<DeepgramOptions>(() => {
    const saved = localStorage.getItem('deepgram_options');
    return saved ? JSON.parse(saved) : DEFAULT_OPTIONS;
  });

  // Persist options to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('deepgram_options', JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    localStorage.setItem('deepgram_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('deepgram_language', language);
  }, [language]);

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
