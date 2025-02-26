
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { cleanupOldFiles, generateFileHash } from "./transcription/storage";
import { simulateProgress } from "./transcription/progress";
import { handleFileUpload, transcribeAudio, handleDownload } from "./transcription/actions";
import { saveTranscriptionData } from "./transcription/saveData";
import { defaultTranscriptionOptions } from "./transcription/options";
import type { TranscriptionHookReturn } from "./transcription/types";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface TranscriptionRecord {
  file_name: string;
  raw_response: any;
}

export const useTranscription = (): TranscriptionHookReturn => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>(defaultTranscriptionOptions);

  // Set up realtime subscription for transcription updates
  useEffect(() => {
    console.log('Setting up realtime subscription for transcription updates');
    const channel = supabase
      .channel('public:transcription_data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transcription_data'
        },
        (payload: RealtimePostgresChangesPayload<TranscriptionRecord>) => {
          console.log('Realtime update received:', payload);
          const newRecord = payload.new as TranscriptionRecord;
          if (newRecord && uploadedFile?.name === newRecord.file_name) {
            const result = transcriptProcessor.processFullResponse(newRecord.raw_response);
            setTranscriptionResult(result);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [uploadedFile]);

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    console.log('Updating transcription options:', {
      currentOptions: options,
      newOptions,
    });

    // Force required options
    const enforcedOptions = {
      ...newOptions,
      smart_format: true,
      diarize: true,
      punctuate: true,
      filler_words: true,
      paragraphs: true,
      formatting: {
        ...newOptions.formatting,
        enableDiarization: true,
        enableParagraphs: true
      }
    };
    
    setOptions(prev => ({ 
      ...prev, 
      ...enforcedOptions,
      formatting: {
        ...prev.formatting,
        ...enforcedOptions.formatting
      }
    }));
    
    console.debug('Options updated:', { 
      previousOptions: options, 
      newOptions: enforcedOptions,
      mergedOptions: { ...options, ...enforcedOptions }
    });
  }, [options]);

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      console.log('File dropped:', {
        fileName: files[0].name,
        fileSize: `${(files[0].size / (1024 * 1024)).toFixed(2)}MB`,
        fileType: files[0].type
      });

      validateFile(files[0]);
      const fileHash = await handleFileUpload(files[0], cleanupOldFiles);
      setUploadedFile(files[0]);
      
      if (fileHash) {
        const cached = await transcriptProcessor.getCachedTranscript(fileHash);
        if (cached) {
          console.log('Using cached transcription result');
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

    // Add verification logging
    console.log('Starting transcription with options:', {
      model: options.model,
      diarize: options.diarize,
      punctuate: options.punctuate,
      smart_format: options.smart_format,
      paragraphs: options.paragraphs,
      filler_words: options.filler_words,
      fullOptions: JSON.stringify(options, null, 2)
    });

    const progressInterval = simulateProgress(setProgress, 10);

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const uniqueId = crypto.randomUUID();
      const audioPath = `${uniqueId}.${fileExt}`;
      const jsonPath = `${uniqueId}.json`;
      
      console.log('Processing file:', {
        originalName: uploadedFile.name,
        audioPath,
        jsonPath
      });

      const data = await transcribeAudio(uploadedFile, options, progressInterval, setProgress);
      console.log('Transcription completed:', {
        success: true,
        responseData: JSON.stringify(data, null, 2)
      });

      const result = transcriptProcessor.processFullResponse(data.data);
      const fileHash = await generateFileHash(uploadedFile);
      
      await transcriptProcessor.cacheTranscript(fileHash, result);
      await saveTranscriptionData(uploadedFile, result, audioPath, jsonPath, options);
      
      setTranscriptionResult(result);
      
      if (result.metadata?.speakers && result.metadata.speakers < 2) {
        toast.warning("Only detected one speaker. Try adjusting the audio quality or checking if multiple speakers are present.");
      } else {
        toast.success(`Detected ${result.metadata?.speakers || 'multiple'} speakers!`);
      }

    } catch (error: any) {
      console.error("❌ Transcription error:", {
        error: JSON.stringify(error, null, 2),
        stack: error instanceof Error ? error.stack : undefined
      });
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
