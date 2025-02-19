
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type FileUploaderProps = {
  onGenerateRules: (text: string) => Promise<void>;
};

const FileUploader = ({ onGenerateRules }: FileUploaderProps) => {
  const [uploadedFile, setUploadedFile] = useState<{ text: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("Please upload a valid document file");
      return;
    }

    const file = acceptedFiles[0];
    console.log("Processing file:", file.name, "Type:", file.type);

    // Check if file type is supported
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      '.pdf',
      '.docx',
      '.txt'
    ];

    if (!supportedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|txt)$/i)) {
      toast.error("Please upload a PDF, DOCX, or TXT file");
      return;
    }

    try {
      setIsProcessing(true);

      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Handle text files directly
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedFile({
            text: reader.result as string,
            name: file.name
          });
          toast.success("Text file processed successfully");
          setIsProcessing(false);
        };
        reader.onerror = () => {
          toast.error("Error reading text file");
          setUploadedFile(null);
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else {
        // Process PDF and DOCX files using the edge function
        const formData = new FormData();
        formData.append('file', file);

        const { data: functionData, error: functionError } = await supabase.functions
          .invoke('process-document', {
            body: formData
          });

        if (functionError) {
          throw new Error(`Error processing document: ${functionError.message}`);
        }

        if (functionData.error) {
          throw new Error(functionData.error);
        }

        setUploadedFile({
          text: functionData.text,
          name: functionData.fileName
        });
        toast.success("Document processed successfully");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(error instanceof Error ? error.message : "Error processing document");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
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
        className={`border-2 border-dashed rounded-lg h-[288px] flex flex-col items-center justify-center cursor-pointer transition-colors
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
                : isProcessing
                  ? "Processing document..."
                  : "Upload PDF, DOCX, or TXT files"
              }
            </p>
            {isProcessing && <Loader2 className="w-6 h-6 mt-2 animate-spin" />}
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
