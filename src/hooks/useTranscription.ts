import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { getAudioDuration, extractAudioChunk, SUPPORTED_AUDIO_TYPES } from "@/utils/audioUtils";
import { processAudioChunk } from "./useDeepgramAPI";
import { useDeepgramOptions } from "./useDeepgramOptions";
import { supabase } from "@/integrations/supabase/client";

export const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

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
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [storedFileName, setStoredFileName] = useState<string>("");
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearAllData = async () => {
    // Clear states
    setTranscript("");
    setProcessingStatus("");
    setProgress(0);
    setStoredFileName("");

    // Clear localStorage
    localStorage.removeItem('deepgram_model');
    localStorage.removeItem('deepgram_language');
    localStorage.removeItem('deepgram_options');

    // Clear existing files in storage if there's a stored file
    if (storedFileName) {
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('transcriptions')
          .list('', {
            search: storedFileName
          });

        if (listError) {
          console.error('Error listing files:', listError);
          return;
        }

        // Delete found files
        if (files && files.length > 0) {
          const filesToDelete = files.map(file => file.name);
          const { error: deleteError } = await supabase.storage
            .from('transcriptions')
            .remove(filesToDelete);

          if (deleteError) {
            console.error('Error deleting files:', deleteError);
          }
        }
      } catch (error) {
        console.error('Error clearing storage:', error);
      }
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleTranscribe = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    // Create new AbortController for this transcription
    abortControllerRef.current?.abort(); // Abort any existing operation
    abortControllerRef.current = new AbortController();
    retryCountRef.current = 0;

    const processWithRetry = async (): Promise<any> => {
      try {
        console.time('totalTranscriptionTime');
        setIsProcessing(true);
        setProgress(0);
        setTranscript("");
        setProcessingStatus("Processing audio file...");

        console.debug('Starting transcription process:', {
          fileName: uploadedFile.name,
          fileSize: `${(uploadedFile.size / (1024 * 1024)).toFixed(2)}MB`,
          fileType: uploadedFile.type,
          attempt: retryCountRef.current + 1
        });

        if (!Object.keys(SUPPORTED_AUDIO_TYPES).includes(uploadedFile.type)) {
          throw new Error(`Unsupported file type. Supported formats are: ${Object.values(SUPPORTED_AUDIO_TYPES).flat().join(', ')}`);
        }

        console.debug('Extracting audio chunk...');
        setProcessingStatus("Extracting audio data...");
        const chunk = await extractAudioChunk(uploadedFile);
        
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        console.debug('Audio chunk extracted:', {
          chunkSize: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`
        });

        setProcessingStatus("Sending audio to Deepgram...");
        setProgress(30);

        const deepgramOptions = {
          ...options,
          smart_format: true,
          punctuate: true,
          diarize: true,
          diarize_version: "3",
          filler_words: true,
          detect_language: true,
          model: model,
          language: language
        };
        
        console.debug('Processing with Deepgram options:', deepgramOptions);
        setProgress(50);
        
        const result = await processAudioChunk(chunk, deepgramOptions);
        
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Operation cancelled');
        }

        console.debug('Received transcript:', {
          length: result.transcript.length,
          preview: result.transcript.substring(0, 100) + '...',
          metadata: result.metadata,
          storedFileName: result.storedFileName
        });
        
        setTranscript(result.transcript.trim());
        setStoredFileName(result.storedFileName);
        setProgress(100);
        setProcessingStatus("Transcription completed!");
        console.timeEnd('totalTranscriptionTime');
        toast.success("Transcription completed and saved successfully!");
        
        return result;
      } catch (error) {
        if (error.message === 'Operation cancelled') {
          console.log('Transcription operation cancelled');
          return;
        }

        console.error("Transcription error:", error);
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.log(`Retrying transcription (attempt ${retryCountRef.current} of ${MAX_RETRIES})...`);
          setProcessingStatus(`Connection failed. Retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
          await delay(RETRY_DELAY);
          return processWithRetry();
        }
        
        throw error;
      }
    };

    try {
      await processWithRetry();
    } catch (error) {
      console.error("All retry attempts failed:", error);
      setProcessingStatus("Error during transcription");
      toast.error(`Transcription failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
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
      // Clear all existing data before processing new file
      await clearAllData();
      
      setIsProcessing(true);
      setProgress(0);
      setProcessingStatus("Validating file...");
      
      await getAudioDuration(file);
      
      setUploadedFile(file);
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
