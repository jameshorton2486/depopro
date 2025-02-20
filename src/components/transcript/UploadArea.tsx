
import { Upload } from "lucide-react";
import type { DropzoneProps } from "./DropzoneProps";
import UploadProgress from "@/components/upload/UploadProgress";

interface UploadAreaProps {
  getRootProps: DropzoneProps["getRootProps"];
  getInputProps: DropzoneProps["getInputProps"];
  isDragActive: boolean;
  uploadedFile: File | null;
  isProcessing: boolean;
  progress: number;
}

const UploadArea = ({
  getRootProps,
  getInputProps,
  isDragActive,
  uploadedFile,
  isProcessing,
  progress
}: UploadAreaProps) => {
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
        ${uploadedFile ? 'border-green-500 bg-green-50/10' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
      
      {uploadedFile ? (
        <div className="text-center">
          <p className="font-medium">{uploadedFile.name}</p>
          <p className="text-sm text-muted-foreground mt-1">
            File uploaded successfully
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground mb-2">
            {isDragActive 
              ? "Drop the file here..."
              : "Drag and drop your transcript file here, or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports DOCX and TXT files (max 10MB)
          </p>
        </div>
      )}

      {isProcessing && (
        <div className="w-full max-w-xs mt-4">
          <UploadProgress progress={progress} />
        </div>
      )}
    </div>
  );
};

export default UploadArea;
