
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { defaultTranscriptionOptions } from "./transcription/options";
import { supabase } from "@/integrations/supabase/client";

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>(defaultTranscriptionOptions);

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({
      ...prev,
      ...newOptions,
    }));
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      validateFile(files[0]);
      setUploadedFile(files[0]);
      toast.success(`File uploaded: ${files[0].name}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const handleTranscribe = useCallback(async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setTranscriptionResult(null);
    setProgress(0);
    setProcessingStatus("Processing audio file...");

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          console.log("File read successfully, sending to edge function");

          // Call the Supabase Edge Function with base64 data
          const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audioData: base64Data,
              options: {
                model: options.model || 'general',
                language: options.language || 'en',
                smart_format: true,
                diarize: true,
                utterances: true,
                punctuate: true,
                paragraphs: true,
              }
            }
          });

          if (error) {
            throw error;
          }

          if (!transcriptionData) {
            throw new Error('No transcription data received');
          }

          console.log("Transcription Data:", transcriptionData);

          const result = transcriptProcessor.processFullResponse(transcriptionData);
          setTranscriptionResult(result);
          setProcessingStatus("Transcription complete");
          setProgress(100);
          
          toast.success(
            result.metadata?.speakers && result.metadata.speakers > 1
              ? `Detected ${result.metadata.speakers} speakers!`
              : "Transcription complete"
          );
        } catch (error: any) {
          console.error("Transcription error:", error);
          toast.error(`Transcription failed: ${error.message}`);
          setProgress(0);
          setProcessingStatus("Transcription failed");
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error("Error reading file");
        setIsProcessing(false);
      };

      reader.readAsDataURL(uploadedFile);
      setProgress(25);
    } catch (error: any) {
      console.error("File reading error:", error);
      toast.error(`Error reading file: ${error.message}`);
      setIsProcessing(false);
    }
  }, [uploadedFile, options]);

  const transcriptText = useMemo(() => 
    transcriptionResult?.transcript || "", 
    [transcriptionResult]
  );

  return {
    uploadedFile,
    transcript: transcriptText,
    transcriptionResult,
    isProcessing,
    processingStatus,
    progress,
    options,
    model: options.model,
    onDrop,
    handleOptionsChange,
    onModelChange: useCallback((model: string) => handleOptionsChange({ model }), [handleOptionsChange]),
    handleTranscribe,
    handleDownload: async (text: string) => {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    },
  };
};
