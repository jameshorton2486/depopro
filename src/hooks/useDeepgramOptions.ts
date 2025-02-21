
import { useState, useEffect } from "react";
import { DeepgramOptions } from "@/types/deepgram";

const defaultOptions: DeepgramOptions = {
  model: "nova-2",
  language: "en",
  smart_format: true,
  punctuate: true,
  diarize: false
};

export const useDeepgramOptions = () => {
  const [model, setModel] = useState(defaultOptions.model);
  const [language, setLanguage] = useState(defaultOptions.language);
  const [options, setOptions] = useState<DeepgramOptions>(defaultOptions);

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
