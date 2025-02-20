
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const DeepgramPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) {
      toast.error("Please upload a valid audio or video file");
      return;
    }

    console.log("Processing file:", file.name, "Type:", file.type);
    
    try {
      setIsProcessing(true);
      setProgress(0);
      setUploadedFile(file);
      
      // Simulate progress for now
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 100);

      // TODO: Add actual file processing logic here
      
      toast.success("File uploaded successfully!");
      setProgress(100);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Error processing file");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 1,
    multiple: false
  });

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
            <h2 className="text-xl font-semibold mb-4">Deepgram Audio Processing</h2>
            <p className="text-muted-foreground mb-6">
              Upload your audio or video files for advanced speech-to-text transcription using Deepgram's AI technology.
            </p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
                ${uploadedFile ? 'border-green-500 bg-green-50/10' : ''}`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <div className="text-center">
                  <FileAudio className="w-12 h-12 mb-4 text-green-500 mx-auto" />
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    File uploaded successfully
                  </p>
                  {isProcessing && (
                    <div className="w-full max-w-xs mt-4">
                      <Progress value={progress} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">
                    {isDragActive 
                      ? "Drop the file here..."
                      : "Drag and drop your audio or video file here, or click to browse"
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supports MP3, WAV, M4A, AAC, MP4, MOV, AVI, and WEBM files
                  </p>
                </>
              )}
            </div>

            {uploadedFile && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    // TODO: Add transcription logic
                    toast.info("Transcription feature coming soon!");
                  }}
                  disabled={isProcessing}
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Transcribe Audio
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeepgramPage;
