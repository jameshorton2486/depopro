
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { getAudioDuration, extractAudioChunk } from "@/utils/audioUtils";

const CHUNK_SIZE = 300; // 5 minutes in seconds
const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes

const DeepgramPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [model, setModel] = useState<string>("nova-3");
  const [language, setLanguage] = useState<string>("en");

  const testApiKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('test-deepgram-key');
      
      if (error) throw error;
      toast.success("Deepgram API key is valid!");
    } catch (error) {
      console.error("API key test error:", error);
      toast.error("Failed to verify Deepgram API key");
    }
  };

  useEffect(() => {
    testApiKey();
  }, []);

  const processAudioChunk = async (chunk: Blob) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          audio: await chunk.arrayBuffer(),
          model,
          language,
        }
      });

      if (error) throw error;
      return data.transcript || "";
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
      setProcessingStatus("Initializing transcription...");

      const duration = await getAudioDuration(uploadedFile);
      const numberOfChunks = Math.ceil(duration / CHUNK_SIZE);
      let fullTranscript = "";

      for (let i = 0; i < numberOfChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, duration);
        
        setProcessingStatus(`Processing chunk ${i + 1} of ${numberOfChunks}...`);
        const chunk = await extractAudioChunk(uploadedFile, start, end);
        const chunkTranscript = await processAudioChunk(chunk);
        
        fullTranscript += chunkTranscript + " ";
        setProgress(((i + 1) / numberOfChunks) * 100);
        setTranscript(fullTranscript.trim());
      }

      setProcessingStatus("Transcription completed!");
      toast.success("Transcription completed successfully!");
    } catch (error) {
      console.error("Transcription error:", error);
      setProcessingStatus("Error during transcription");
      toast.error(`Error during transcription: ${error.message}`);
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
      setUploadedFile(file);
      setTranscript("");
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error processing file");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
      setProgress(100);
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
          <div className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Deepgram Integration
          </div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
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
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Transcribe Audio
                </Button>
              </div>
            )}
            <TranscriptDisplay
              transcript={transcript}
              onDownload={downloadTranscript}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeepgramPage;
