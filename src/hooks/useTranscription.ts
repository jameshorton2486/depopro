
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { toast } from "sonner";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { validateFile } from "@/utils/fileValidation";

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>("");
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

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setTranscript("");
    setProgress(0);
    setProcessingStatus("Processing audio...");

    const progressInterval = simulateProgress(10);

    try {
      console.debug('Starting transcription for file:', {
        name: uploadedFile.name,
        size: `${(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB`,
        type: uploadedFile.type
      });

      // Convert file to base64
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
      
      setTranscript(data.transcript);
      toast.success("Transcription completed!");
      console.debug('Transcription completed successfully:', {
        transcriptLength: data.transcript.length,
        preview: data.transcript.substring(0, 100) + '...'
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
    transcript,
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
