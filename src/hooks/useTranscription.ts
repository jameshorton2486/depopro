import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { toast } from "sonner";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { validateFile } from "@/utils/fileValidation";
import { 
  createTranscriptRecord, 
  updateTranscriptStatus, 
  updateTranscriptText,
  processAudioFile 
} from "@/services/transcriptService";

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-2",
    language: "en",
    smart_format: true,
    diarize: true,
    punctuate: true,
    filler_words: true,
    paragraphs: true,
    utterances: false,
    keywords: [],
    keyterm: ""
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
      console.debug('✅ File accepted');
    } catch (error: any) {
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
      console.error('❌ No file uploaded');
      toast.error("Please upload a file first");
      return;
    }

    console.debug('🎬 Starting transcription process:', {
      fileName: uploadedFile.name,
      fileType: uploadedFile.type,
      fileSize: `${(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB`,
      options: JSON.stringify(options, null, 2)
    });

    setIsProcessing(true);
    setTranscript("");
    setProgress(0);

    const progressInterval = simulateProgress(10);

    try {
      const processOptions: DeepgramOptions = {
        ...options,
        smart_format: true,
        punctuate: true,
        paragraphs: true,
        diarize: options.diarize,
        filler_words: options.filler_words,
        utterances: options.utterances ?? false,
        keywords: options.keywords || [],
        keyterm: options.keyterm || "",
        model: options.model,
        language: options.language
      };

      console.debug('🔍 Processing with options:', processOptions);
      
      setProcessingStatus("Processing audio...");
      toast.info("Starting transcription process...");
      
      const transcriptText = await processAudioFile(uploadedFile, processOptions);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTranscript(transcriptText);
      console.debug('✅ Transcription completed successfully');
      toast.success("Transcription completed!");

    } catch (error: any) {
      console.error("❌ Transcription error:", {
        error: error.message,
        stack: error.stack,
        type: error.name
      });
      toast.error(`Transcription failed: ${error.message}`);
      
      clearInterval(progressInterval);
      setProgress(0);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsProcessing(false);
      setProcessingStatus("");
      console.debug('🏁 Transcription process finished');
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
    language: options.language,
    onDrop,
    handleOptionsChange,
    onModelChange: (model: string) => handleOptionsChange({ model }),
    onLanguageChange: (language: string) => handleOptionsChange({ language }),
    handleTranscribe,
    handleDownload,
  };
};
