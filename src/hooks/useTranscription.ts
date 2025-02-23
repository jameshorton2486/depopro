
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
        // Only increment up to 90% during processing
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

    const progressInterval = simulateProgress(10); // Start at 10%

    try {
      // Create a temporary ID for the transcript
      const tempId = crypto.randomUUID();
      
      setProcessingStatus("Processing audio...");
      toast.info("Starting transcription process...");
      
      // Process the audio file
      const transcriptText = await processAudioFile(uploadedFile, options);
      
      // Clear the progress interval before setting the final state
      clearInterval(progressInterval);
      
      // Set progress to 100% when actually complete
      setProgress(100);
      
      // Small delay before setting the transcript to ensure UI updates
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
      
      // Clear interval and reset progress on error
      clearInterval(progressInterval);
      setProgress(0);
    } finally {
      // Small delay before resetting processing state
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
