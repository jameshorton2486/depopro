
import { useState, useEffect } from "react";
import { DeepgramOptions } from "@/types/deepgram";

const defaultOptions: DeepgramOptions = {
  model: "nova-3",
  language: "en-US",
  smart_format: true,
  punctuate: true,
  diarize: true,
  filler_words: true,
  detect_language: true
};

const loadSavedOptions = (): DeepgramOptions => {
  try {
    const saved = localStorage.getItem("deepgram_options");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        model: parsed.model || defaultOptions.model,
        language: parsed.language || defaultOptions.language,
        smart_format: parsed.smart_format ?? defaultOptions.smart_format,
        punctuate: parsed.punctuate ?? defaultOptions.punctuate,
        diarize: parsed.diarize ?? defaultOptions.diarize,
        filler_words: parsed.filler_words ?? defaultOptions.filler_words,
        detect_language: parsed.detect_language ?? defaultOptions.detect_language
      };
    }
  } catch (error) {
    console.warn("Error loading saved options, using defaults:", error);
  }
  return { ...defaultOptions };
};

export const useDeepgramOptions = () => {
  const [model, setModel] = useState(defaultOptions.model);
  const [language, setLanguage] = useState(defaultOptions.language);
  const [options, setOptions] = useState<DeepgramOptions>(loadSavedOptions);

  useEffect(() => {
    try {
      localStorage.setItem('deepgram_model', model);
      console.debug('Stored model:', model);
    } catch (error) {
      console.error('Error storing model:', error);
    }
  }, [model]);

  useEffect(() => {
    try {
      localStorage.setItem('deepgram_language', language);
      console.debug('Stored language:', language);
    } catch (error) {
      console.error('Error storing language:', error);
    }
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('deepgram_options', JSON.stringify(options));
      console.debug('Updated Deepgram options:', options);
    } catch (error) {
      console.error('Error storing options:', error);
    }
  }, [options]);

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    setOptions(current => ({
      ...current,
      ...newOptions
    }));
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
