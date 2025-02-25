
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import UploadedFileDisplay from "./UploadedFileDisplay";
import { supabase } from "@/integrations/supabase/client";

export const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB in bytes

interface FileUploaderProps {
  onGenerateRules?: (text: string) => Promise<void>;
}

const FileUploader = ({ onGenerateRules }: FileUploaderProps) => {
  const [uploadedFile, setUploadedFile] = useState<{ name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

    console.log("Uploading audio file:", file.name, "Type:", file.type, "Size:", `${(file.size / (1024 * 1024)).toFixed(2)}MB`);

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }

      setUploadedFile({ name: file.name });
      toast.success("Audio file uploaded successfully");
      
      // Call onGenerateRules if provided
      if (onGenerateRules) {
        await onGenerateRules(filePath);
      }
    } catch (error) {
      console.error("Error uploading audio file:", error);
      toast.error(error instanceof Error ? error.message : "Error uploading audio");
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [onGenerateRules]);

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
                : isUploading
                  ? "Uploading audio..."
                  : "Upload MP3, WAV, FLAC, M4A, or AAC files (max 3GB)"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
