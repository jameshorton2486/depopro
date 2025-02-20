
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAudioDuration, extractAudioChunk, SUPPORTED_AUDIO_TYPES } from "@/utils/audioUtils";

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  type?: 'filler' | undefined;
}

interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: Word[];
  fillerWords: Word[];
}

interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  punctuate: boolean;
  diarize: boolean;
  utterances: boolean;
  filler_words: boolean;
  detect_language: boolean;
}

export const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [utterances, setUtterances] = useState<TranscriptUtterance[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [model, setModel] = useState<string>("nova-3");
  const [language, setLanguage] = useState<string>("en");
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-3",
    language: "en",
    smart_format: true,
    punctuate: true,
    diarize: true,
    utterances: true,
    filler_words: true,
    detect_language: true
  });

  const handleOptionsChange = (newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  const processAudioChunk = async (chunk: Blob) => {
    try {
      console.log('Sending audio chunk to Deepgram:', {
        size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
        type: chunk.type,
        options
      });

      const arrayBuffer = await chunk.arrayBuffer();

      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          audio: Array.from(new Uint8Array(arrayBuffer)),
          model: options.model,
          language: options.language,
          mime_type: chunk.type,
          options: {
            smart_format: options.smart_format,
            punctuate: options.punctuate,
            diarize: options.diarize,
            utterances: options.utterances,
            filler_words: options.filler_words,
            detect_language: options.detect_language
          }
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

      return {
        transcript: data.transcript,
        utterances: data.utterances || [],
        metadata: data.metadata
      };
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
      setUtterances([]);
      setProcessingStatus("Processing audio file...");

      if (!Object.keys(SUPPORTED_AUDIO_TYPES).includes(uploadedFile.type)) {
        throw new Error(`Unsupported file type. Supported formats are: ${Object.values(SUPPORTED_AUDIO_TYPES).flat().join(', ')}`);
      }

      const chunk = await extractAudioChunk(uploadedFile);
      setProcessingStatus("Sending audio to Deepgram...");
      
      const result = await processAudioChunk(chunk);
      console.log('Received transcript:', {
        length: result.transcript.length,
        preview: result.transcript.substring(0, 100) + '...',
        utteranceCount: result.utterances.length,
        metadata: result.metadata
      });
      
      setTranscript(result.transcript.trim());
      setUtterances(result.utterances);
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

  return {
    uploadedFile,
    isProcessing,
    progress,
    transcript,
    utterances,
    processingStatus,
    model,
    language,
    options,
    setModel,
    setLanguage,
    handleOptionsChange,
    testApiKey,
    handleTranscribe,
    onDrop,
    downloadTranscript,
  };
};
