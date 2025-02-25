
import { useState, useCallback } from "react";
import { processTextInBatches, uploadAndProcessFile } from "@/services/fileProcessing";
import { toast } from "sonner";

interface SaveStatus {
  transcriptSaved: boolean;
  audioSaved: boolean;
  jsonSaved: boolean;
}

export const useTranscriptUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [correctedText, setCorrectedText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    transcriptSaved: false,
    audioSaved: false,
    jsonSaved: false
  });

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploadedFile(file);
    setIsProcessing(true);
    setSaveStatus({
      transcriptSaved: false,
      audioSaved: false,
      jsonSaved: false
    });

    try {
      const result = await uploadAndProcessFile(file, setProgress);
      setCorrectedText(result.text);
      setSaveStatus({
        transcriptSaved: true,
        audioSaved: true,
        jsonSaved: true
      });
      toast.success("Files processed and saved successfully");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error processing file");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const handleInitialFormatting = useCallback(async () => {
    if (!correctedText) return;
    
    setIsProcessing(true);
    try {
      const processed = await processTextInBatches(correctedText, setProgress);
      setCorrectedText(processed);
      setSaveStatus(prev => ({ ...prev, transcriptSaved: true }));
      toast.success("Initial formatting complete");
    } catch (error) {
      console.error("Error during initial formatting:", error);
      toast.error("Error during initial formatting");
    } finally {
      setIsProcessing(false);
    }
  }, [correctedText]);

  const handleRulesFormatting = useCallback(async () => {
    if (!correctedText) return;
    
    setIsProcessing(true);
    try {
      const processed = await processTextInBatches(correctedText, setProgress);
      setCorrectedText(processed);
      setSaveStatus(prev => ({ ...prev, jsonSaved: true }));
      toast.success("Rules formatting complete");
    } catch (error) {
      console.error("Error during rules formatting:", error);
      toast.error("Error during rules formatting");
    } finally {
      setIsProcessing(false);
    }
  }, [correctedText]);

  return {
    uploadedFile,
    correctedText,
    isProcessing,
    progress,
    saveStatus,
    onDrop,
    handleInitialFormatting,
    handleRulesFormatting
  };
};
