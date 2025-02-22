
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
    paragraphs: true
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

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 1000);
    return interval;
  };

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      console.error('❌ No file uploaded');
      toast.error("Please upload a file first");
      return;
    }

    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error('❌ User not authenticated:', sessionError);
      toast.error("Please sign in to transcribe files");
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

    const progressInterval = simulateProgress();

    try {
      // Create record and start processing
      const transcriptRecord = await createTranscriptRecord(uploadedFile, session.user.id);
      await updateTranscriptStatus(transcriptRecord.id, 'processing');

      setProcessingStatus("Processing audio...");
      toast.info("Starting transcription process...");
      
      // Process the audio file
      const transcriptText = await processAudioFile(uploadedFile, options);
      
      // Update the transcript
      await updateTranscriptText(transcriptRecord.id, transcriptText);
      
      setTranscript(transcriptText);
      console.debug('✅ Transcription completed successfully');
      toast.success("Transcription completed!");

      // Set progress to 100% when done
      setProgress(100);

    } catch (error: any) {
      console.error("❌ Transcription error:", {
        error: error.message,
        stack: error.stack,
        type: error.name
      });
      toast.error(`Transcription failed: ${error.message}`);
    } finally {
      clearInterval(progressInterval);
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
