
import { useState, useEffect } from "react";
import { DeepgramOptions } from "@/types/deepgram";

const defaultOptions: DeepgramOptions = {
  model: "nova-3",
  language: "en-US",
  smart_format: true,
  punctuate: true,
  diarize: true,
  filler_words: true,
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
    try {
      const saved = localStorage.getItem('deepgram_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all required options are present
        return {
          ...defaultOptions,
          ...parsed
        };
      }
      return defaultOptions;
    } catch (error) {
      console.error('Error parsing stored options:', error);
      return defaultOptions;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('deepgram_model', model);
      console.log('Stored model:', model);
    } catch (error) {
      console.error('Error storing model:', error);
    }
  }, [model]);

  useEffect(() => {
    try {
      localStorage.setItem('deepgram_language', language);
      console.log('Stored language:', language);
    } catch (error) {
      console.error('Error storing language:', error);
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('deepgram_options', JSON.stringify(options));
      console.log('Updated Deepgram options:', options);
    } catch (error) {
      console.error('Error storing options:', error);
    }
  }, [options]);

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    console.log('Changing options:', newOptions);
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
