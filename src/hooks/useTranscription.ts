
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { defaultTranscriptionOptions } from "./transcription/options";
import { supabase } from "@/integrations/supabase/client";

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

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
      // Create URL with query parameters
      const queryParams = new URLSearchParams({
        model: options.model || 'general',
        smart_format: 'true',
        diarize: 'true',
        utterances: 'true',
        punctuate: 'true',
        paragraphs: 'true',
        language: options.language || 'en',
      });

      const url = `${DEEPGRAM_API_URL}?${queryParams.toString()}`;

      // Create form data with the audio file
      const formData = new FormData();
      formData.append('audio', uploadedFile);

      console.log('Sending request to Deepgram:', {
        url,
        fileType: uploadedFile.type,
        fileSize: uploadedFile.size,
        options: Object.fromEntries(queryParams.entries())
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${errorText}`);
      }

      const data = await response.json();
      console.log('Deepgram response:', data);

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
