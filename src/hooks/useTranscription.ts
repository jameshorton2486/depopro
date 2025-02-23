
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { cleanupOldFiles, generateFileHash } from "./transcription/storage";
import { simulateProgress } from "./transcription/progress";
import { handleFileUpload, transcribeAudio, handleDownload } from "./transcription/actions";
import type { TranscriptionHookReturn } from "./transcription/types";
import { supabase } from "@/integrations/supabase/client";

export const useTranscription = (): TranscriptionHookReturn => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-meeting",
    language: "en-US",
    smart_format: true,
    diarize: true,
    punctuate: true,
    filler_words: true,
    paragraphs: true,
    utterances: false,
    keywords: [],
    keyterms: []
  });

  const saveTranscriptionData = async (
    file: File,
    result: TranscriptionResult,
    audioPath: string
  ) => {
    try {
      const { error } = await supabase
        .from('transcription_data')
        .insert({
          file_name: file.name,
          file_path: audioPath,
          metadata: {
            duration: result.metadata?.audioLength,
            speakers: result.metadata?.speakers,
            model: options.model,
            language: options.language
          },
          raw_response: result
        });

      if (error) throw error;
      toast.success('Transcription saved successfully');
    } catch (error) {
      console.error('Error saving transcription:', error);
      toast.error('Failed to save transcription data');
    }
  };

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
    console.debug('🔄 Options updated:', { 
      previousOptions: options, 
      newOptions,
      mergedOptions: { ...options, ...newOptions }
    });
  }, [options]);

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      validateFile(files[0]);
      const fileHash = await handleFileUpload(files[0], cleanupOldFiles);
      setUploadedFile(files[0]);
      
      if (fileHash) {
        const cached = await transcriptProcessor.getCachedTranscript(fileHash);
        if (cached) {
          setTranscriptionResult(cached);
          toast.info("Retrieved cached transcription");
        }
      }
      
      toast.success(`File "${files[0].name}" uploaded successfully`);
    } catch (error: any) {
      console.error('❌ File validation error:', error);
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
    setProcessingStatus("Processing audio...");

    const progressInterval = simulateProgress(setProgress, 10);

    try {
      // Upload audio file to Supabase Storage
      const fileExt = uploadedFile.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('transcriptions')
        .upload(filePath, uploadedFile);

      if (uploadError) throw uploadError;

      const data = await transcribeAudio(uploadedFile, options, progressInterval, setProgress);
      const result = transcriptProcessor.processFullResponse(data.data);
      const fileHash = await generateFileHash(uploadedFile);
      
      await transcriptProcessor.cacheTranscript(fileHash, result);
      await saveTranscriptionData(uploadedFile, result, filePath);
      
      setTranscriptionResult(result);
      toast.success("Transcription completed and saved!");

    } catch (error: any) {
      console.error("❌ Transcription error:", error);
      toast.error(`Transcription failed: ${error.message}`);
      clearInterval(progressInterval);
      setProgress(0);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsProcessing(false);
      setProcessingStatus("");
    }
  }, [uploadedFile, options]);

  return {
    uploadedFile,
    transcript: transcriptionResult?.transcript || "",
    transcriptionResult,
    isProcessing,
    processingStatus,
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
