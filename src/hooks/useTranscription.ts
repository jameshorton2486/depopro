
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type DeepgramOptions = {
  model?: string;
  language?: string;
  smart_format?: boolean;
  diarize?: boolean;
  utterances?: boolean;
  punctuate?: boolean;
  paragraphs?: boolean;
};

type TranscriptionResult = {
  transcript: string;
  metadata?: {
    speakers?: number;
    duration?: number;
  };
  segments?: any[];
};

// Simple transcript processor
const transcriptProcessor = {
  processFullResponse: (data: any): TranscriptionResult => {
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    const speakers = data.results?.channels[0]?.alternatives[0]?.speaker_count || 0;
    const duration = data.metadata?.duration;
    
    return {
      transcript,
      metadata: {
        speakers,
        duration
      },
      segments: data.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs || []
    };
  }
};

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>({
    model: 'general',
    language: 'en',
    smart_format: true,
    diarize: true,
    utterances: true,
    punctuate: true,
    paragraphs: true,
  });

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({
      ...prev,
      ...newOptions,
    }));
  }, []);

  // File validation function
  const validateFile = (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/mp4'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit (100MB)`);
    }
  };

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
          setProgress(25);
          setProcessingStatus("Sending to transcription service...");
          
          // Call the Supabase Edge Function with base64 data
          const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audioData: base64Data,
              options
            }
          });

          if (error) {
            throw error;
          }

          if (!transcriptionData) {
            throw new Error('No transcription data received');
          }

          setProgress(75);
          setProcessingStatus("Processing transcription...");
          
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
    onDrop,
    handleOptionsChange,
    onModelChange: useCallback((model: string) => handleOptionsChange({ model }), [handleOptionsChange]),
    handleTranscribe,
    handleDownload: useCallback((text: string) => {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    }, []),
  };
};
