
import { useDropzone } from "react-dropzone";
import { Upload, FileAudio } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DeepgramOptions } from "@/types/deepgram";

interface FileUploadAreaProps {
  model: string;
  language: string;
  options: DeepgramOptions;
  onProcess: (chunk: Blob, options: DeepgramOptions) => Promise<any>;
}

export const FileUploadArea = ({
  model,
  language,
  options,
  onProcess
}: FileUploadAreaProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        await onProcess(file, { ...options, model, language });
      }
    },
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/x-m4a': ['.m4a'],
      'audio/aac': ['.aac'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/x-msvideo': ['.avi'],
      'video/webm': ['.webm']
    },
    maxFiles: 1,
    multiple: false,
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
        ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
      <p className="text-muted-foreground mb-2">
        {isDragActive 
          ? "Drop the file here..."
          : "Drag and drop your audio file here, or click to browse"
        }
      </p>
      <p className="text-sm text-muted-foreground">
        Supports MP3, WAV, M4A, AAC, MP4, MOV, AVI, and WEBM files
      </p>
    </div>
  );
};
