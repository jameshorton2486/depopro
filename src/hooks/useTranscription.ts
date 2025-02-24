import { useState, useCallback } from "react";
import { toast } from "sonner";
import { validateFile } from "@/utils/fileValidation";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { DeepgramOptions, TranscriptionResult, DeepgramParagraph } from "@/types/deepgram";
import { cleanupOldFiles, generateFileHash } from "./transcription/storage";
import { simulateProgress } from "./transcription/progress";
import { handleFileUpload, transcribeAudio, handleDownload } from "./transcription/actions";
import type { TranscriptionHookReturn } from "./transcription/types";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const useTranscription = (): TranscriptionHookReturn => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState<DeepgramOptions>({
    model: "nova-meeting",
    language: "en-US",
    smart_format: true,
    diarize: true,
    punctuate: true,
    filler_words: true,
    paragraphs: true,
    utterances: true,
    utteranceThreshold: 0.2,
    keywords: [],
    keyterms: [],
    formatting: {
      timestampFormat: "HH:mm:ss",
      boldSpeakerNames: true,
      highlightFillerWords: true,
      removeExtraSpaces: true,
      standardizePunctuation: true
    }
  });

  const convertParagraphToJson = (paragraph: DeepgramParagraph): Json => ({
    speaker: paragraph.speaker,
    start: paragraph.start,
    end: paragraph.end,
    sentences: paragraph.sentences.map(sentence => ({
      text: sentence.text,
      start: sentence.start,
      end: sentence.end
    }))
  });

  const saveTranscriptionData = async (
    file: File,
    result: TranscriptionResult,
    audioPath: string,
    jsonPath: string
  ) => {
    try {
      const jsonResult: Json = {
        transcript: result.transcript,
        paragraphs: result.paragraphs?.map(convertParagraphToJson) || [],
        metadata: {
          processingTime: result.metadata?.processingTime,
          audioLength: result.metadata?.audioLength,
          speakers: result.metadata?.speakers,
          fillerWords: result.metadata?.fillerWords
        }
      };

      const { error: jsonError } = await supabase.storage
        .from('json file')
        .upload(jsonPath, JSON.stringify(jsonResult, null, 2), {
          contentType: 'application/json',
          upsert: false
        });

      if (jsonError) throw jsonError;

      const { error: dbError } = await supabase
        .from('transcription_data')
        .insert({
          file_name: file.name,
          file_path: audioPath,
          metadata: {
            duration: result.metadata?.audioLength,
            speakers: result.metadata?.speakers,
            model: options.model,
            language: options.language,
            jsonPath: jsonPath
          } as Json,
          raw_response: jsonResult
        });

      if (dbError) throw dbError;
      toast.success('Transcription and data saved successfully');
    } catch (error) {
      console.error('Error saving transcription:', error);
      toast.error('Failed to save transcription data');
      throw error;
    }
  };

  const handleOptionsChange = useCallback((newOptions: Partial<DeepgramOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
    console.debug('🔄 Options updated:', { 
      previousOptions: options, 
      newOptions,
      mergedOptions: { ...options, ...newOptions }
    });
  }, [options]);

  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      validateFile(files[0]);
      const fileHash = await handleFileUpload(files[0], cleanupOldFiles);
      setUploadedFile(files[0]);
      
      if (fileHash) {
        const cached = await transcriptProcessor.getCachedTranscript(fileHash);
        if (cached) {
          setTranscriptionResult(cached);
          toast.info("Retrieved cached transcription");
        }
      }
      
      toast.success(`File "${files[0].name}" uploaded successfully`);
    } catch (error: any) {
      console.error('❌ File validation error:', error);
      toast.error(error.message);
    }
  }, []);

  const handleTranscribe = useCallback(async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setTranscriptionResult(null);
    setProgress(0);
    setProcessingStatus("Processing audio...");

    const progressInterval = simulateProgress(setProgress, 10);

    try {
      const fileExt = uploadedFile.name.split('.').pop();
      const uniqueId = crypto.randomUUID();
      const audioPath = `${uniqueId}.${fileExt}`;
      const jsonPath = `${uniqueId}.json`;
      
      const { error: uploadError } = await supabase.storage
        .from('audio file')
        .upload(audioPath, uploadedFile);

      if (uploadError) throw uploadError;

      console.log('Starting transcription with options:', options);
      
      const data = await transcribeAudio(uploadedFile, options, progressInterval, setProgress);
      const result = transcriptProcessor.processFullResponse(data.data);
      
      console.log('Transcription result:', result);
      
      const fileHash = await generateFileHash(uploadedFile);
      
      await transcriptProcessor.cacheTranscript(fileHash, result);
      await saveTranscriptionData(uploadedFile, result, audioPath, jsonPath);
      
      setTranscriptionResult(result);
      
      if (result.metadata?.speakers && result.metadata.speakers < 2) {
        toast.warning("Only detected one speaker. Try adjusting the audio quality or checking if multiple speakers are present.");
      } else {
        toast.success(`Detected ${result.metadata?.speakers || 'multiple'} speakers!`);
      }

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
  }, [uploadedFile, options]);

  return {
    uploadedFile,
    transcript: transcriptionResult?.transcript || "",
    transcriptionResult,
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
