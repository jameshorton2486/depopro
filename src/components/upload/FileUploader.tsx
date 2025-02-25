
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UploadProgress from "./UploadProgress";
import UploadedFileDisplay from "./UploadedFileDisplay";
import { uploadAndProcessFile, MAX_FILE_SIZE } from "@/services/fileProcessing";

type FileUploaderProps = {
  onGenerateRules: (text: string) => Promise<void>;
};

const FileUploader = ({ onGenerateRules }: FileUploaderProps) => {
  const [uploadedFile, setUploadedFile] = useState<{ text: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("Please upload a valid audio file");
      return;
    }

    const file = acceptedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than 3GB. Current size: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`);
      return;
    }

    console.log("Processing audio file:", file.name, "Type:", file.type, "Size:", `${(file.size / (1024 * 1024)).toFixed(2)}MB`);

    try {
      setIsProcessing(true);
      setProgress(0);
      
      const processedFile = await uploadAndProcessFile(file, setProgress);
      setUploadedFile(processedFile);
      toast.success("Audio processed successfully");
    } catch (error) {
      console.error("Error processing audio file:", error);
      toast.error(error instanceof Error ? error.message : "Error processing audio");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/flac': ['.flac'],
      'audio/x-m4a': ['.m4a'],
      'audio/aac': ['.aac'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error(`File size must be less than 3GB. Current size: ${(fileRejections[0].file.size / (1024 * 1024 * 1024)).toFixed(2)}GB`);
      } else {
        toast.error("Invalid file type. Please upload an MP3, WAV, FLAC, M4A, or AAC file");
      }
    }
  });

  const handleGenerateRules = async () => {
    if (!uploadedFile) {
      toast.error("Please upload an audio file first");
      return;
    }

    try {
      setIsProcessing(true);
      await onGenerateRules(uploadedFile.text);
      setUploadedFile(null);
    } catch (error) {
      console.error("Error generating rules:", error);
      toast.error("Failed to generate rules from audio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-2">Upload Audio</h3>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg h-[288px] flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
          ${uploadedFile ? 'border-green-500 bg-green-50/10' : ''}`}
      >
        <input {...getInputProps()} />
        {uploadedFile ? (
          <UploadedFileDisplay fileName={uploadedFile.name} />
        ) : (
          <>
            <UploadIcon className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive 
                ? "Drop the audio file here..."
                : isProcessing
                  ? `Processing audio... ${progress}%`
                  : "Upload MP3, WAV, FLAC, M4A, or AAC files (max 3GB)"}
            </p>
            {isProcessing && <UploadProgress progress={progress} />}
          </>
        )}
      </div>
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleGenerateRules}
          disabled={!uploadedFile || isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
          Generate Rules from Audio
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
