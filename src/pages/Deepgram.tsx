
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@deepgram/sdk";

const CHUNK_SIZE = 300; // 5 minutes in seconds
const MAX_FILE_SIZE = 2000 * 1024 * 1024; // 2GB in bytes

const DeepgramPage = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string>("");

  const processAudioChunk = async (chunk: Blob, deepgram: any) => {
    try {
      const arrayBuffer = await chunk.arrayBuffer();
      const { result } = await deepgram.listen.prerecorded.transcribeFile(
        new Uint8Array(arrayBuffer),
        {
          model: "nova-3",
          smart_format: true,
        }
      );
      return result.results?.channels[0]?.alternatives[0]?.transcript || "";
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

      const deepgram = createClient(import.meta.env.VITE_DEEPGRAM_API_KEY);
      const duration = await getAudioDuration(uploadedFile);
      const numberOfChunks = Math.ceil(duration / CHUNK_SIZE);
      let fullTranscript = "";

      for (let i = 0; i < numberOfChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, duration);
        
        const chunk = await extractAudioChunk(uploadedFile, start, end);
        const chunkTranscript = await processAudioChunk(chunk, deepgram);
        
        fullTranscript += chunkTranscript + " ";
        setProgress(((i + 1) / numberOfChunks) * 100);
        setTranscript(fullTranscript.trim());
      }

      toast.success("Transcription completed successfully!");
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Error during transcription");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        audio.src = e.target?.result as string;
        audio.onloadedmetadata = () => resolve(audio.duration);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const extractAudioChunk = async (file: File, start: number, end: number): Promise<Blob> => {
    // For now, we'll return the whole file as one chunk
    // In a production environment, you'd want to properly slice the audio file
    return file;
  };

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

    console.log("Processing file:", file.name, "Type:", file.type);
    
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
                    Supports MP3, WAV, M4A, AAC, MP4, MOV, AVI, and WEBM files (max 2GB)
                  </p>
                </>
              )}
            </div>

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

            {transcript && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Transcript</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTranscript('txt')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download as TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadTranscript('docx')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download as DOCX
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  <p className="text-sm">{transcript}</p>
                </ScrollArea>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeepgramPage;
