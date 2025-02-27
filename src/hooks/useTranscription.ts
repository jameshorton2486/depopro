
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
      // Convert file to base64
      const reader = new FileReader();
      const fileBase64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(uploadedFile);
      });

      const base64Data = await fileBase64Promise;
      const base64Audio = (base64Data as string).split(',')[1]; // Remove data URL prefix

      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          audio: base64Audio,
          fileName: uploadedFile.name,
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
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('No transcription data received');
      }

      console.log('Transcription response:', data);

      const result = transcriptProcessor.processFullResponse(data);
      setTranscriptionResult(result);
      setProcessingStatus("Transcription complete");
      
      toast.success(
        result.metadata?.speakers && result.metadata.speakers > 1
          ? `Detected ${result.metadata.speakers} speakers!`
          : "Transcription complete"
      );
    } catch (error: any) {
      console.error('Transcription error:', error);
      toast.error(`Transcription failed: ${error.message}`);
      setProgress(0);
      setProcessingStatus("Transcription failed");
    } finally {
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
