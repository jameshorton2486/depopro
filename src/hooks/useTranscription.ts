
import { useState } from "react";
import { processAudioChunk } from "./useDeepgramAPI";
import { DeepgramOptions } from "@/types/deepgram";
import { toast } from "sonner";

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [model, setModel] = useState("nova-2");
  const [language, setLanguage] = useState("en");
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-2",
    language: "en",
    smart_format: true,
    diarize: false,
    punctuate: true
  });

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  const onDrop = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const supportedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (!supportedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload an audio or video file.");
      return;
    }

    if (file.size > 2000 * 1024 * 1024) { // 2GB limit
      toast.error("File is too large. Maximum size is 2GB.");
      return;
    }

    setUploadedFile(file);
  };

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setTranscript("");
    setProgress(0);

    try {
      setProcessingStatus("Preparing audio for processing...");
      
      const result = await processAudioChunk(uploadedFile, options);
      
      if (!result?.transcript) {
        throw new Error("No transcript received from processing");
      }

      setTranscript(result.transcript);
      toast.success("Transcription completed successfully!");
      
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error(`Transcription failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
      setProgress(0);
    }
  };

  return {
    uploadedFile,
    transcript,
    isProcessing,
    processingStatus,
    progress,
    model,
    language,
    options,
    onDrop,
    setModel,
    setLanguage,
    handleOptionsChange,
    handleTranscribe,
  };
};
