
import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { defaultTranscriptionOptions } from "./transcription/options";
import { supabase } from "@/integrations/supabase/client";

interface TranscriptionRecord {
  file_name: string;
  raw_response: any;
}

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>(defaultTranscriptionOptions);

  // Memoize subscription setup to prevent unnecessary re-renders
  const setupSubscription = useCallback((fileName: string) => {
    return supabase
      .channel('public:transcription_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transcription_data' },
        (payload: any) => {
          const record = payload.new as TranscriptionRecord;
          if (record && fileName === record.file_name) {
            const result = transcriptProcessor.processFullResponse(record.raw_response);
            setTranscriptionResult(result);
          }
        }
      )
      .subscribe();
  }, []);

  useEffect(() => {
    if (!uploadedFile) return;

    const channel = setupSubscription(uploadedFile.name);
    return () => {
      supabase.removeChannel(channel);
    };
  }, [uploadedFile, setupSubscription]);

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({
      ...prev,
      ...newOptions,
      smart_format: true,
      diarize: true,
      punctuate: true,
      filler_words: true,
      paragraphs: true,
    }));
  }, []);

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      validateFile(files[0]);
      setUploadedFile(files[0]);
      const fileHash = await transcriptProcessor.generateFileHash(files[0]);
      
      if (fileHash) {
        const cached = await transcriptProcessor.getCachedTranscript(fileHash);
        if (cached) {
          setTranscriptionResult(cached);
          toast.info("Retrieved cached transcription");
          return;
        }
      }
      
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
      const formData = new FormData();
      formData.append('audio', uploadedFile);

      const response = await fetch(DEEPGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const result = transcriptProcessor.processFullResponse(data);
      
      const fileHash = await transcriptProcessor.generateFileHash(uploadedFile);
      if (fileHash) {
        await transcriptProcessor.cacheTranscript(fileHash, result);
      }
      
      setTranscriptionResult(result);
      setProcessingStatus("Transcription complete");
      
      toast.success(
        result.metadata?.speakers && result.metadata.speakers > 1
          ? `Detected ${result.metadata.speakers} speakers!`
          : "Transcription complete"
      );
    } catch (error: any) {
      toast.error(`Transcription failed: ${error.message}`);
      setProgress(0);
      setProcessingStatus("Transcription failed");
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile]);

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
