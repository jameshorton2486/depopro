
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type TrainingRules } from "@/services/openai";
import { Button } from "@/components/ui/button";

type FileUploaderProps = {
  onGenerateRules: (text: string) => Promise<void>;
};

const FileUploader = ({ onGenerateRules }: FileUploaderProps) => {
  const [uploadedFile, setUploadedFile] = useState<{ text: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("Please upload a valid document file");
      return;
    }

    const file = acceptedFiles[0];
    if (!file.type.includes('document')) {
      toast.error("Please upload a document file (PDF or DOCX)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFile({
        text: reader.result as string,
        name: file.name
      });
      toast.success("Document uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Error reading document file");
      setUploadedFile(null);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  const handleGenerateRules = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a document first");
      return;
    }

    try {
      setIsProcessing(true);
      await onGenerateRules(uploadedFile.text);
      setUploadedFile(null); // Reset after successful processing
    } catch (error) {
      console.error("Error generating rules:", error);
      toast.error("Failed to generate rules from document");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-2">Upload Document</h3>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg h-[280px] flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
          ${uploadedFile ? 'border-green-500 bg-green-50/10' : ''}`}
      >
        <input {...getInputProps()} />
        {uploadedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-green-500" />
            <p className="text-sm font-medium">{uploadedFile.name}</p>
            <p className="text-sm text-muted-foreground">File uploaded successfully</p>
          </div>
        ) : (
          <>
            <UploadIcon className="w-8 h-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive 
                ? "Drop the document here..."
                : "Upload PDF or Document files"
              }
            </p>
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
          Generate Rules from Document
        </Button>
      </div>
    </div>
  );
};

export default FileUploader;
