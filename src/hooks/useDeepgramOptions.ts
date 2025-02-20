
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

export const useDeepgramOptions = () => {
  const [model, setModel] = useState(defaultOptions.model);
  const [language, setLanguage] = useState(defaultOptions.language);
  // Initialize options with forced true values regardless of stored settings
  const [options] = useState<DeepgramOptions>(() => {
    const saved = localStorage.getItem("deepgram_options");
    const parsed = saved ? JSON.parse(saved) : defaultOptions;

    // Always enforce true values for boolean options
    return {
      model: parsed.model || defaultOptions.model,
      language: parsed.language || defaultOptions.language,
      smart_format: true,
      punctuate: true,
      diarize: true,
      filler_words: true,
      detect_language: true
    };
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
      // Store options with forced true values
      const optionsToStore = {
        ...options,
        smart_format: true,
        punctuate: true,
        diarize: true,
        filler_words: true,
        detect_language: true
      };
      localStorage.setItem('deepgram_options', JSON.stringify(optionsToStore));
      console.log('Updated Deepgram options:', optionsToStore);
    } catch (error) {
      console.error('Error storing options:', error);
    }
  }, []);

  const handleOptionsChange = () => {
    // No-op since we're keeping all options true
    console.log('Options changes disabled, using default true values');
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
