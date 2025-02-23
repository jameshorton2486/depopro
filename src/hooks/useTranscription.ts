
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions, DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { TranscriptionFile } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";

export const useTranscription = () => {
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

  const cleanupOldFiles = useCallback(async () => {
    try {
      // Get all previous transcription files
      const { data: files, error: fetchError } = await supabase
        .from('transcription_files')
        .select('*');

      if (fetchError) throw fetchError;

      // Delete storage objects
      for (const file of files || []) {
        await supabase.storage
          .from('transcriptions')
          .remove([file.audio_file_path, file.json_file_path]);
      }

      // Delete database records
      if (files?.length) {
        const { error: deleteError } = await supabase
          .from('transcription_files')
          .delete()
          .in('id', files.map(f => f.id));

        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
      // Don't throw error as this is not critical
    }
  }, []);

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
    console.debug('🔄 Options updated:', { 
      previousOptions: options, 
      newOptions,
      mergedOptions: { ...options, ...newOptions }
    });
  };

  const onDrop = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      validateFile(files[0]);
      await cleanupOldFiles(); // Clean up old files before setting new one
      setUploadedFile(files[0]);
      toast.success(`File "${files[0].name}" uploaded successfully`);
      
      // Try to get cached transcript
      const fileHash = await generateFileHash(files[0]);
      const cached = await transcriptProcessor.getCachedTranscript(fileHash);
      if (cached) {
        setTranscriptionResult(cached);
        toast.info("Retrieved cached transcription");
      }

      console.debug('✅ File accepted:', {
        name: files[0].name,
        size: `${(files[0].size / (1024 * 1024)).toFixed(2)}MB`,
        type: files[0].type,
        cached: !!cached
      });
    } catch (error: any) {
      console.error('❌ File validation error:', error);
      toast.error(error.message);
    }
  };

  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const simulateProgress = (startAt: number = 0) => {
    setProgress(startAt);
    return setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          return prev;
        }
        return prev + 2;
      });
    }, 1000);
  };

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setTranscriptionResult(null);
    setProgress(0);
    setProcessingStatus("Processing audio...");

    const progressInterval = simulateProgress(10);

    try {
      const fileHash = await generateFileHash(uploadedFile);
      const cached = await transcriptProcessor.getCachedTranscript(fileHash);
      
      if (cached) {
        setTranscriptionResult(cached);
        toast.success("Retrieved from cache");
        return;
      }

      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          const base64Content = base64String.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = (error) => {
          console.error('Failed to read file:', error);
          reject(new Error('Failed to read audio file'));
        };
        reader.readAsDataURL(uploadedFile);
      });

      console.debug('Calling transcribe function with options:', {
        ...options,
        fileName: uploadedFile.name
      });

      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: {
          audioData: base64Content,
          fileName: uploadedFile.name,
          options
        }
      });

      if (error) {
        console.error('Transcription function error:', error);
        throw error;
      }

      if (data.error) {
        console.error('Transcription processing error:', data.error);
        throw new Error(data.error);
      }

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = transcriptProcessor.processFullResponse(data.data);
      await transcriptProcessor.cacheTranscript(fileHash, result);
      
      setTranscriptionResult(result);
      toast.success("Transcription completed!");
      console.debug('Transcription completed successfully:', {
        result,
        speakers: result.metadata?.speakers,
        paragraphs: result.paragraphs?.length,
        storedFiles: data.files
      });

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
  };

  const handleDownload = (transcript: string) => {
    if (!transcript) return;
    createAndDownloadWordDoc(transcript);
    toast.success("Transcript downloaded as Word document");
  };

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
