
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { toast } from "sonner";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";

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
    toast.success(`File "${file.name}" uploaded successfully`);
    console.debug('✅ File accepted');
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

    try {
      // Create initial transcript record with user_id
      const { data: transcriptRecord, error: createError } = await supabase
        .from('transcripts')
        .insert({
          name: uploadedFile.name,
          file_type: uploadedFile.type,
          file_size: uploadedFile.size,
          status: 'pending',
          original_text: '', // Initialize with empty string since it's required
          user_id: session.user.id // Add user_id field
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create transcript record: ${createError.message}`);
      }

      // Update status to processing
      const { error: processingError } = await supabase
        .from('transcripts')
        .update({ status: 'processing' })
        .eq('id', transcriptRecord.id);

      if (processingError) {
        console.error('Failed to update processing status:', processingError);
      }

      setProcessingStatus("Processing audio...");
      toast.info("Starting transcription process...");
      
      // Convert file to base64
      const reader = new FileReader();
      const fileBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64String = reader.result as string;
          const base64Content = base64String.split(',')[1];
          resolve(base64Content);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(uploadedFile);
      const base64Content = await fileBase64Promise;

      // Call Supabase Edge Function for transcription
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: {
          audioData: base64Content,
          fileName: uploadedFile.name,
          options
        }
      });

      if (error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }

      if (!data?.transcript) {
        throw new Error("No transcript received from processing");
      }

      // Update transcript record with the result
      const { error: updateError } = await supabase
        .from('transcripts')
        .update({
          original_text: data.transcript,
          status: 'corrected' // Using 'corrected' instead of 'completed' to match the enum
        })
        .eq('id', transcriptRecord.id);

      if (updateError) {
        console.error('Failed to update transcript record:', updateError);
      }

      setTranscript(data.transcript);
      console.debug('✅ Transcription completed successfully');
      toast.success("Transcription completed!");

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
