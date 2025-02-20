
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getAudioDuration, extractAudioChunk, SUPPORTED_AUDIO_TYPES } from "@/utils/audioUtils";
import { processAudioChunk } from "./useDeepgramAPI";
import { useDeepgramOptions } from "./useDeepgramOptions";
import { TranscriptUtterance } from "@/types/deepgram";

export const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes

export const useTranscription = () => {
  const {
    model,
    language,
    options,
    setModel,
    setLanguage,
    handleOptionsChange,
  } = useDeepgramOptions();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [utterances, setUtterances] = useState<TranscriptUtterance[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [storedFileName, setStoredFileName] = useState<string>("");

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setTranscript("");
      setUtterances([]);
      setProcessingStatus("Processing audio file...");

      if (!Object.keys(SUPPORTED_AUDIO_TYPES).includes(uploadedFile.type)) {
        throw new Error(`Unsupported file type. Supported formats are: ${Object.values(SUPPORTED_AUDIO_TYPES).flat().join(', ')}`);
      }

      const chunk = await extractAudioChunk(uploadedFile);
      setProcessingStatus("Sending audio to Deepgram...");

      // Enhanced Deepgram options
      const deepgramOptions = {
        ...options,
        smart_format: true,
        punctuate: true,
        diarize: true,
        diarize_version: "3",
        utterances: true,
        filler_words: true,
        detect_language: true,
        model: model,
        language: language
      };
      
      const result = await processAudioChunk(chunk, deepgramOptions);
      console.log('Received transcript:', {
        length: result.transcript.length,
        preview: result.transcript.substring(0, 100) + '...',
        utteranceCount: result.utterances.length,
        metadata: result.metadata,
        storedFileName: result.storedFileName
      });
      
      setTranscript(result.transcript.trim());
      setUtterances(result.utterances);
      setStoredFileName(result.storedFileName);
      setProgress(100);
      setProcessingStatus("Transcription completed!");
      toast.success("Transcription completed and saved successfully!");
    } catch (error) {
      console.error("Transcription error:", error);
      setProcessingStatus("Error during transcription");
      toast.error(`Transcription failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      toast.error("Please upload a valid audio or video file");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 2GB limit");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setProcessingStatus("Validating file...");
      
      await getAudioDuration(file);
      
      setUploadedFile(file);
      setTranscript("");
      toast.success("File validated and ready for transcription");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(`Error processing file: ${error.message}`);
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setProcessingStatus("");
    }
  }, []);

  const downloadTranscript = (format: 'txt' | 'docx') => {
    if (!transcript) {
      toast.error("No transcript available to download");
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcript.${format}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return {
    uploadedFile,
    isProcessing,
    progress,
    transcript,
    utterances,
    processingStatus,
    storedFileName,
    model,
    language,
    options,
    setModel,
    setLanguage,
    handleOptionsChange,
    handleTranscribe,
    onDrop,
    downloadTranscript,
  };
};
