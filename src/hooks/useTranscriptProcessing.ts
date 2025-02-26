
import { useState, useCallback } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { TrainingRules } from "@/services/openai";

export const useTranscriptProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const validateJson = useCallback((text: string): boolean => {
    try {
      JSON.parse(text);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const processTranscript = useCallback(async (text: string, rules: string) => {
    if (!text || !rules) {
      toast.error("Please provide both transcript and rules");
      return;
    }

    if (!validateJson(rules)) {
      toast.error("Invalid JSON format for rules");
      return;
    }

    setIsProcessing(true);
    try {
      const corrections = JSON.parse(rules) as TrainingRules;
      
      const { data, error } = await supabase.functions.invoke('process-corrections', {
        body: {
          text,
          rules: corrections
        }
      });

      if (error) throw error;

      const correctedTranscript = data.correctedText;
      createAndDownloadWordDoc(correctedTranscript);
      toast.success("Transcript corrected and saved as Word document");
      
      return correctedTranscript;
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Failed to process corrections");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    processTranscript,
    validateJson
  };
};
