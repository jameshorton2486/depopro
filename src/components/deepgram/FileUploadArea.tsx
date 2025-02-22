
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface FileUploadAreaProps {
  uploadedFile: File | null;
  isProcessing: boolean;
  processingStatus: string;
  progress: number;
  onDrop: (acceptedFiles: File[]) => void;
}

export const FileUploadArea = ({
  uploadedFile,
  isProcessing,
  processingStatus,
  progress,
  onDrop
}: FileUploadAreaProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/x-m4a': ['.m4a'],
      'audio/aac': ['.aac'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/webm': ['.webm'],
      'audio/flac': ['.flac'],
      'audio/x-flac': ['.flac']
    },
    maxFiles: 1,
    multiple: false,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((error) => {
          let errorMessage = '';
          switch (error.code) {
            case 'file-too-large':
              errorMessage = 'File is too large. Maximum size is 2GB';
              break;
            case 'file-invalid-type':
              errorMessage = 'Invalid file type. Please upload an audio or video file';
              break;
            case 'too-many-files':
              errorMessage = 'Please upload only one file at a time';
              break;
            default:
              errorMessage = error.message;
          }
          toast.error(errorMessage);
        });
      });
    },
    validator: (file) => {
      if (file.size > 2000 * 1024 * 1024) {
        return {
          code: "file-too-large",
          message: `File is larger than 2GB`
        };
      }
      return null;
    }
  });

  return (
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
              : "Drag and drop your audio file here, or click to browse"
            }
          </p>
          <p className="text-sm text-muted-foreground">
            Supports MP3, WAV, FLAC, M4A, AAC, MP4, MOV, AVI, and WEBM files (max 2GB)
          </p>
        </>
      )}
    </div>
  );
};
