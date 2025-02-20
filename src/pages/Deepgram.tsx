import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { getAudioDuration, extractAudioChunk, SUPPORTED_AUDIO_TYPES } from "@/utils/audioUtils";

const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes

const DeepgramPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [model, setModel] = useState<string>("nova-3");
  const [language, setLanguage] = useState<string>("en");
  
  // Reference for the processing container
  const processingRef = useRef<HTMLDivElement>(null);

  // Handle focus management during processing
  useEffect(() => {
    if (isProcessing) {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.setAttribute('inert', '');
      }
      processingRef.current?.focus();
    } else {
      const mainContent = document.querySelector('main');
      if (mainContent) {
        mainContent.removeAttribute('inert');
      }
    }
  }, [isProcessing]);

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
      
      // Attempt to validate and play the audio file
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="flex flex-col items-center mb-16 animate-fade-down">
          <h1 className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Deepgram Integration
          </h1>
          <a 
            href="/" 
            className="text-sm hover:text-primary/80 transition-colors"
            aria-label="Back to Home"
          >
            Back to Home
          </a>
        </nav>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
          aria-live="polite"
        >
          <div className="bg-background border rounded-lg p-6">
            <DeepgramHeader onTestApiKey={testApiKey} />
            <TranscriptionControls
              model={model}
              language={language}
              onModelChange={setModel}
              onLanguageChange={setLanguage}
            />
            <FileUploadArea
              uploadedFile={uploadedFile}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
              progress={progress}
              onDrop={onDrop}
            />
            {uploadedFile && (
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  onClick={handleTranscribe}
                  disabled={isProcessing}
                  aria-busy={isProcessing}
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
                  {isProcessing ? "Transcribing..." : "Transcribe Audio"}
                </Button>
              </div>
            )}
            <div
              ref={processingRef}
              tabIndex={-1}
              role="status"
              aria-live="assertive"
              className="sr-only"
            >
              {processingStatus}
            </div>
            <TranscriptDisplay
              transcript={transcript}
              onDownload={downloadTranscript}
            />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DeepgramPage;
