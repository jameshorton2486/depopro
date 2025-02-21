
import { useState } from "react";
import { processAudioInChunks } from "@/hooks/useDeepgramAPI";
import { DeepgramOptions } from "@/types/deepgram";
import { AudioPreprocessor } from "@/utils/audioPreprocessing";
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
    console.debug('📁 File dropped:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    });

    const supportedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (!supportedTypes.includes(file.type)) {
      console.error('❌ Unsupported file type:', {
        providedType: file.type,
        supportedTypes
      });
      toast.error("Unsupported file type. Please upload an audio or video file.");
      return;
    }

    if (file.size > 2000 * 1024 * 1024) { // 2GB limit
      console.error('❌ File too large:', {
        size: `${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`,
        maxSize: '2GB'
      });
      toast.error("File is too large. Maximum size is 2GB.");
      return;
    }

    setUploadedFile(file);
    console.debug('✅ File accepted');
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

    try {
      setProcessingStatus("Processing audio...");
      console.debug('🎙 Starting audio processing');
      
      const result = await processAudioInChunks(uploadedFile, options, (progress) => {
        setProgress(progress);
      });

      console.debug('📝 Received processing result:', {
        success: !!result?.transcript,
        transcriptLength: result?.transcript?.length || 0
      });
      
      if (!result?.transcript) {
        throw new Error("No transcript received from processing");
      }

      setTranscript(result.transcript);
      console.debug('✅ Transcription completed successfully');
      toast.success("Transcription completed successfully!");
      
    } catch (error: any) {
      console.error("❌ Transcription error:", {
        error: error.message,
        stack: error.stack,
        type: error.name
      });
      toast.error(`Transcription failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
      setProgress(0);
      console.debug('🏁 Transcription process finished');
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
