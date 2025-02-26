
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { handleFileUpload, transcribeAudio, handleDownload } from "./transcription/actions";
import { defaultTranscriptionOptions } from "./transcription/options";
import { supabase } from "@/integrations/supabase/client";

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>(defaultTranscriptionOptions);

  useEffect(() => {
    const channel = supabase
      .channel('public:transcription_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transcription_data' },
        (payload) => {
          if (payload.new && uploadedFile?.name === payload.new.file_name) {
            const result = transcriptProcessor.processFullResponse(payload.new.raw_response);
            setTranscriptionResult(result);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [uploadedFile]);

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
      const fileHash = await handleFileUpload(files[0]);
      setUploadedFile(files[0]);
      
      if (fileHash) {
        const cached = await transcriptProcessor.getCachedTranscript(fileHash);
        if (cached) {
          setTranscriptionResult(cached);
          toast.info("Retrieved cached transcription");
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

    try {
      const data = await transcribeAudio(uploadedFile, options, setProgress);
      const result = transcriptProcessor.processFullResponse(data.data);
      const fileHash = await handleFileUpload(uploadedFile);
      
      if (fileHash) {
        await transcriptProcessor.cacheTranscript(fileHash, result);
      }
      
      setTranscriptionResult(result);
      toast.success(
        result.metadata?.speakers && result.metadata.speakers > 1
          ? `Detected ${result.metadata.speakers} speakers!`
          : "Transcription complete"
      );
    } catch (error: any) {
      toast.error(`Transcription failed: ${error.message}`);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedFile, options]);

  return {
    uploadedFile,
    transcript: transcriptionResult?.transcript || "",
    transcriptionResult,
    isProcessing,
    progress,
    options,
    model: options.model,
    onDrop,
    handleOptionsChange,
    onModelChange: (model: string) => handleOptionsChange({ model }),
    handleTranscribe,
    handleDownload,
  };
};
