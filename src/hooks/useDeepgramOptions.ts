
import { useState, useEffect } from "react";
import { DeepgramOptions } from "@/types/deepgram";

const defaultOptions: DeepgramOptions = {
  model: "nova-3",
  language: "en-US",
  smart_format: true,
  punctuate: true,
  diarize: true,
  filler_words: false,
  detect_language: false
};

export const useDeepgramOptions = () => {
  const [model, setModel] = useState(() => {
    const saved = localStorage.getItem('deepgram_model');
    return saved || defaultOptions.model;
  });

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('deepgram_language');
    return saved || defaultOptions.language;
  });

  const [options, setOptions] = useState<DeepgramOptions>(() => {
    const saved = localStorage.getItem('deepgram_options');
    return saved ? JSON.parse(saved) : defaultOptions;
  });

  useEffect(() => {
    localStorage.setItem('deepgram_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('deepgram_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('deepgram_options', JSON.stringify(options));
  }, [options]);

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
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
