
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAudioDuration, extractAudioChunk } from "@/utils/audioUtils";

export const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [model, setModel] = useState<string>("nova-3");
  const [language, setLanguage] = useState<string>("en");

  const testApiKey = async () => {
    try {
      setIsProcessing(true);
      setProcessingStatus("Testing Deepgram API key...");

      const { data, error } = await supabase.functions.invoke('test-deepgram-key');

      if (error) {
        console.error('Error testing API key:', error);
        toast.error("Failed to test Deepgram API key");
        return;
      }

      if (data?.success) {
        toast.success("Deepgram API key is valid!");
      } else {
        toast.error("Invalid Deepgram API key");
      }
    } catch (error) {
      console.error("Error testing API key:", error);
      toast.error("Failed to test Deepgram API key");
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const processAudioChunk = async (chunk: Blob) => {
    try {
      console.log('Sending audio chunk to Deepgram:', {
        size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
        type: chunk.type,
      });

      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          audio: await chunk.arrayBuffer(),
          model,
          language,
          mime_type: chunk.type,
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.transcript) {
        console.error('No transcript in response:', data);
        throw new Error('No transcript received from Deepgram');
      }

      return data.transcript;
    } catch (error) {
      console.error("Error processing chunk:", error);
      throw error;
    }
  };

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setTranscript("");
      setProcessingStatus("Processing audio file...");

      const chunk = await extractAudioChunk(uploadedFile);
      setProcessingStatus("Sending audio to Deepgram...");
      
      const chunkTranscript = await processAudioChunk(chunk);
      console.log('Received transcript:', {
        length: chunkTranscript.length,
        preview: chunkTranscript.substring(0, 100) + '...',
      });
      
      setTranscript(chunkTranscript.trim());
      setProgress(100);
      setProcessingStatus("Transcription completed!");
      toast.success("Transcription completed successfully!");
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
    processingStatus,
    model,
    language,
    setModel,
    setLanguage,
    testApiKey,
    handleTranscribe,
    onDrop,
    downloadTranscript,
  };
};
