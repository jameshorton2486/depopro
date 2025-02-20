
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, Loader2, Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const processAudioChunk = async (chunk: Blob) => {
    try {
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      console.log("API Key present:", !!apiKey);
      
      if (!apiKey) {
        throw new Error("Deepgram API key is not configured");
      }

      const arrayBuffer = await chunk.arrayBuffer();
      console.log("Processing chunk size:", arrayBuffer.byteLength, "bytes");

      // Add query parameters for language and features
      const queryParams = new URLSearchParams({
        model,
        language,
        smart_format: "true",
        utterances: "true",
        punctuate: "true",
      });

      setProcessingStatus("Sending chunk to Deepgram API...");
      const response = await fetch(`https://api.deepgram.com/v1/listen?${queryParams}`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "audio/wav",
        },
        body: new Uint8Array(arrayBuffer),
      });

      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Deepgram API error details:", errorText);
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        throw new Error(`Deepgram API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Transcription result:", result);

      if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        console.warn("Unexpected API response structure:", result);
        throw new Error("Invalid API response format");
      }

      return result.results.channels[0].alternatives[0].transcript || "";
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

      console.log("Starting transcription for file:", uploadedFile.name);
      console.log("File type:", uploadedFile.type);
      console.log("File size:", uploadedFile.size, "bytes");

      const duration = await getAudioDuration(uploadedFile);
      console.log("Audio duration:", duration, "seconds");

      const numberOfChunks = Math.ceil(duration / CHUNK_SIZE);
      console.log("Number of chunks to process:", numberOfChunks);

      let fullTranscript = "";

      for (let i = 0; i < numberOfChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min((i + 1) * CHUNK_SIZE, duration);
        
        setProcessingStatus(`Processing chunk ${i + 1} of ${numberOfChunks}...`);
        console.log(`Processing chunk ${i + 1}/${numberOfChunks} (${start}s to ${end}s)`);
        
        const chunk = await extractAudioChunk(uploadedFile, start, end);
        console.log(`Chunk ${i + 1} size:`, chunk.size, "bytes");
        
        const chunkTranscript = await processAudioChunk(chunk);
        console.log(`Chunk ${i + 1} transcript:`, chunkTranscript);
        
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
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const audioBuffer = await audioContext.decodeAudioData(e.target?.result as ArrayBuffer);
          
          const sampleRate = audioBuffer.sampleRate;
          const startSample = Math.floor(start * sampleRate);
          const endSample = Math.floor(end * sampleRate);
          const numberOfChannels = audioBuffer.numberOfChannels;
          
          const chunkLength = endSample - startSample;
          const chunkBuffer = audioContext.createBuffer(
            numberOfChannels,
            chunkLength,
            sampleRate
          );

          for (let channel = 0; channel < numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            const chunkChannelData = chunkBuffer.getChannelData(channel);
            
            for (let i = 0; i < chunkLength; i++) {
              chunkChannelData[i] = channelData[startSample + i];
            }
          }

          const chunks: Float32Array[] = [];
          for (let channel = 0; channel < numberOfChannels; channel++) {
            chunks.push(chunkBuffer.getChannelData(channel));
          }

          const interleaved = new Float32Array(chunkLength * numberOfChannels);
          for (let i = 0; i < chunkLength; i++) {
            for (let channel = 0; channel < numberOfChannels; channel++) {
              interleaved[i * numberOfChannels + channel] = chunks[channel][i];
            }
          }

          const buffer = new ArrayBuffer(44 + interleaved.length * 2);
          const view = new DataView(buffer);

          writeString(view, 0, 'RIFF');
          view.setUint32(4, 36 + interleaved.length * 2, true);
          writeString(view, 8, 'WAVE');
          writeString(view, 12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, numberOfChannels, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * numberOfChannels * 2, true);
          view.setUint16(32, numberOfChannels * 2, true);
          view.setUint16(34, 16, true);
          writeString(view, 36, 'data');
          view.setUint32(40, interleaved.length * 2, true);

          const volume = 0.5;
          for (let i = 0; i < interleaved.length; i++) {
            view.setInt16(44 + i * 2, interleaved[i] * 0x7FFF * volume, true);
          }

          const wavBlob = new Blob([buffer], { type: 'audio/wav' });
          resolve(wavBlob);
        } catch (error) {
          reject(error);
        } finally {
          audioContext.close();
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
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

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Deepgram Audio Processing</h2>
                <p className="text-muted-foreground mt-2">
                  Upload your audio or video files for advanced speech-to-text transcription.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="w-40">
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nova-3">Nova (Best)</SelectItem>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-40">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

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
                    <div className="space-y-2 mt-4">
                      <p className="text-sm text-muted-foreground">{processingStatus}</p>
                      <Progress value={progress} className="w-64" />
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
