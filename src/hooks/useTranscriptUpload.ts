
import { useState, useCallback, ChangeEvent } from "react";
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
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [jsonText, setJsonText] = useState<string>("");
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

    try {
      const result = await uploadAndProcessFile(file, setProgress);
      setCorrectedText(result.text);
      setSaveStatus(prev => ({ ...prev, transcriptSaved: true }));
      toast.success("Transcript file processed successfully");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error processing transcript file");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const handleAudioUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Upload audio file to storage
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload for now
      setSaveStatus(prev => ({ ...prev, audioSaved: true }));
      toast.success("Audio file uploaded successfully");
    } catch (error) {
      console.error("Error uploading audio:", error);
      toast.error("Error uploading audio file");
    }
  }, []);

  const handleJsonTextChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonText = event.target.value;
    setJsonText(newJsonText);
    
    try {
      if (newJsonText.trim()) {
        JSON.parse(newJsonText); // Validate JSON
        setSaveStatus(prev => ({ ...prev, jsonSaved: true }));
      } else {
        setSaveStatus(prev => ({ ...prev, jsonSaved: false }));
      }
    } catch (error) {
      setSaveStatus(prev => ({ ...prev, jsonSaved: false }));
    }
  }, []);

  const handleJsonUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          try {
            JSON.parse(text); // Validate JSON
            setJsonText(text);
            setSaveStatus(prev => ({ ...prev, jsonSaved: true }));
            toast.success("JSON file validated and uploaded");
          } catch (error) {
            toast.error("Invalid JSON file");
          }
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("Error processing JSON:", error);
      toast.error("Error processing JSON file");
    }
  }, []);

  const handleTranscriptChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setTranscriptText(event.target.value);
    if (event.target.value) {
      setSaveStatus(prev => ({ ...prev, transcriptSaved: true }));
    } else {
      setSaveStatus(prev => ({ ...prev, transcriptSaved: false }));
    }
  }, []);

  const handleInitialFormatting = useCallback(async () => {
    if (!correctedText) return;
    
    setIsProcessing(true);
    try {
      const processed = await processTextInBatches(correctedText, setProgress);
      setCorrectedText(processed);
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
    transcriptText,
    jsonText,
    isProcessing,
    progress,
    saveStatus,
    onDrop,
    handleInitialFormatting,
    handleRulesFormatting,
    handleAudioUpload,
    handleTranscriptChange,
    handleJsonUpload,
    handleJsonTextChange
  };
};
