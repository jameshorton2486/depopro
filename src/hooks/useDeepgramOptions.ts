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
  const [options] = useState<DeepgramOptions>(defaultOptions);

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
      localStorage.setItem('deepgram_options', JSON.stringify(defaultOptions));
      console.log('Updated Deepgram options:', defaultOptions);
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
