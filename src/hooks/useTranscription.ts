import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions, DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { toast } from "sonner";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { validateFile } from "@/utils/fileValidation";

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-2",
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
      setUploadedFile(files[0]);
      toast.success(`File "${files[0].name}" uploaded successfully`);
      console.debug('✅ File accepted:', {
        name: files[0].name,
        size: `${(files[0].size / (1024 * 1024)).toFixed(2)}MB`,
        type: files[0].type
      });
    } catch (error: any) {
      console.error('❌ File validation error:', error);
      toast.error(error.message);
    }
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

  const processDeepgramResponse = (response: DeepgramResponse): TranscriptionResult => {
    const alternative = response.results.channels[0].alternatives[0];
    const paragraphs = alternative.paragraphs?.paragraphs || [];

    return {
      transcript: alternative.transcript,
      paragraphs,
      metadata: {
        processingTime: response.metadata.processing_time,
        audioLength: response.metadata.duration,
        speakers: paragraphs.reduce((acc, p) => Math.max(acc, p.speaker), 0) + 1
      }
    };
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
      
      const result = processDeepgramResponse(data.data);
      setTranscriptionResult(result);
      toast.success("Transcription completed!");
      console.debug('Transcription completed successfully:', {
        result,
        speakers: result.metadata?.speakers,
        paragraphs: result.paragraphs?.length
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
