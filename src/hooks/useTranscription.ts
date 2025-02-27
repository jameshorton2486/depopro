
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type DeepgramOptions = {
  model?: string;
  language?: string;
  smart_format?: boolean;
  diarize?: boolean;
  utterances?: boolean;
  punctuate?: boolean;
  paragraphs?: boolean;
  detect_language?: boolean;
  utteranceThreshold?: number;
  filler_words?: boolean;
  formatting?: boolean;
  keywords?: string[];
  keyterms?: {
    id: string;
    term: string;
    boost: number;
  }[];
};

export type TranscriptionResult = {
  transcript: string;
  metadata?: {
    speakers?: number;
    duration?: number;
    language?: string;
    processingTime?: number;
    audioLength?: number;
  };
  segments?: any[];
  paragraphs?: any[];
};

type TranscriptionSource = "file" | "url" | null;

// Simple transcript processor
const transcriptProcessor = {
  processFullResponse: (data: any): TranscriptionResult => {
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    const speakers = data.results?.channels[0]?.alternatives[0]?.speaker_count || 0;
    const duration = data.metadata?.duration;
    const processingTime = data.metadata?.processing_time;
    const audioLength = data.metadata?.duration;
    const detectedLanguage = data.results?.channels[0]?.alternatives[0]?.language || data.metadata?.language;
    const paragraphs = data.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs || [];
    
    return {
      transcript,
      metadata: {
        speakers,
        duration,
        language: detectedLanguage,
        processingTime,
        audioLength
      },
      segments: data.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs || [],
      paragraphs
    };
  }
};

export const useTranscription = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [currentSource, setCurrentSource] = useState<TranscriptionSource>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>({
    model: 'nova-2',
    language: 'en',
    smart_format: true,
    diarize: true,
    utterances: true,
    punctuate: true,
    paragraphs: true,
    detect_language: true,
    filler_words: false,
    formatting: true,
    keywords: [],
    keyterms: []
  });

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({
      ...prev,
      ...newOptions,
    }));
  }, []);

  // File validation function
  const validateFile = (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/mp4'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit (100MB)`);
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      validateFile(files[0]);
      setUploadedFile(files[0]);
      setCurrentSource("file");
      setAudioUrl(""); // Clear URL when file is uploaded
      toast.success(`File uploaded: ${files[0].name}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setAudioUrl(url);
    setCurrentSource("url");
    setUploadedFile(null); // Clear file when URL is provided
  }, []);

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com/') || url.includes('youtu.be/');
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleTranscribe = useCallback(async () => {
    if (!currentSource) {
      toast.error("Please upload a file or provide a URL first");
      return;
    }

    if (currentSource === "url" && !audioUrl) {
      toast.error("Please provide a valid URL");
      return;
    }

    if (currentSource === "url" && !validateUrl(audioUrl)) {
      toast.error("Please provide a valid URL");
      return;
    }

    if (currentSource === "file" && !uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setTranscriptionResult(null);
    setProgress(0);
    setProcessingStatus(`Processing ${currentSource === "file" ? "audio file" : "audio from URL"}...`);

    try {
      // Handle file upload
      if (currentSource === "file" && uploadedFile) {
        // Read file as base64
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            setProgress(30);
            setProcessingStatus("Sending to transcription service...");
            
            // Call the Supabase Edge Function with base64 data
            const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { 
                audioData: base64Data,
                options
              }
            });

            if (error) {
              throw error;
            }

            if (!transcriptionData) {
              throw new Error('No transcription data received');
            }

            setProgress(75);
            setProcessingStatus("Processing transcription...");
            
            const result = transcriptProcessor.processFullResponse(transcriptionData);
            setTranscriptionResult(result);
            setProcessingStatus("Transcription complete");
            setProgress(100);
            
            toast.success(
              result.metadata?.speakers && result.metadata.speakers > 1
                ? `Detected ${result.metadata.speakers} speakers!`
                : "Transcription complete"
            );
            
            if (result.metadata?.language && result.metadata.language !== options.language) {
              toast.info(`Detected language: ${result.metadata.language}`);
            }
          } catch (error: any) {
            console.error("Transcription error:", error);
            toast.error(`Transcription failed: ${error.message}`);
            setProgress(0);
            setProcessingStatus("Transcription failed");
          } finally {
            setIsProcessing(false);
          }
        };

        reader.onerror = () => {
          toast.error("Error reading file");
          setIsProcessing(false);
        };

        reader.readAsDataURL(uploadedFile);
      } 
      // Handle URL transcription (including YouTube)
      else if (currentSource === "url" && audioUrl) {
        setProgress(15);
        setProcessingStatus(`Fetching audio from ${isYouTubeUrl(audioUrl) ? "YouTube" : "URL"}...`);
        
        try {
          const { data: transcriptionData, error } = await supabase.functions.invoke('transcribe-audio', {
            body: { 
              audioUrl,
              options,
              isYouTube: isYouTubeUrl(audioUrl)
            }
          });

          if (error) {
            throw error;
          }

          if (!transcriptionData) {
            throw new Error('No transcription data received');
          }

          setProgress(75);
          setProcessingStatus("Processing transcription...");
          
          const result = transcriptProcessor.processFullResponse(transcriptionData);
          setTranscriptionResult(result);
          setProcessingStatus("Transcription complete");
          setProgress(100);
          
          toast.success(
            result.metadata?.speakers && result.metadata.speakers > 1
              ? `Detected ${result.metadata.speakers} speakers!`
              : "Transcription complete"
          );
          
          if (result.metadata?.language && result.metadata.language !== options.language) {
            toast.info(`Detected language: ${result.metadata.language}`);
          }
        } catch (error: any) {
          console.error("URL transcription error:", error);
          toast.error(`Transcription failed: ${error.message}`);
          setProgress(0);
          setProcessingStatus("Transcription failed");
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error: any) {
      console.error("General transcription error:", error);
      toast.error(`Transcription failed: ${error.message}`);
      setProgress(0);
      setProcessingStatus("Transcription failed");
      setIsProcessing(false);
    }
  }, [uploadedFile, audioUrl, currentSource, options]);

  const transcriptText = useMemo(() => 
    transcriptionResult?.transcript || "", 
    [transcriptionResult]
  );

  const resetTranscription = useCallback(() => {
    setTranscriptionResult(null);
    setProgress(0);
    setProcessingStatus("");
  }, []);

  return {
    // File-related props
    uploadedFile,
    onDrop,
    
    // URL-related props
    audioUrl,
    handleUrlChange,
    isYouTubeUrl: useCallback((url: string) => isYouTubeUrl(url), []),
    
    // Source tracking
    currentSource,
    setCurrentSource,
    
    // Transcription result and status
    transcript: transcriptText,
    transcriptionResult,
    isProcessing,
    processingStatus,
    progress,
    
    // Options
    options,
    handleOptionsChange,
    onModelChange: useCallback((model: string) => handleOptionsChange({ model }), [handleOptionsChange]),
    
    // Actions
    handleTranscribe,
    resetTranscription,
    handleDownload: useCallback((text: string) => {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.click();
      window.URL.revokeObjectURL(url);
    }, []),
  };
};
