import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type FileUploaderProps = {
  onGenerateRules: (text: string) => Promise<void>;
};

const MAX_FILE_SIZE = 2.7 * 1024 * 1024; // ~2.7MB in bytes (2 times 1,336 KB)
const CHUNK_SIZE = 4000; // characters per chunk for OpenAI API

const FileUploader = ({ onGenerateRules }: FileUploaderProps) => {
  const [uploadedFile, setUploadedFile] = useState<{ text: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const splitTextIntoChunks = (text: string): string[] => {
    const chunks: string[] = [];
    let currentChunk = '';

    const sentences = text.split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= CHUNK_SIZE) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  };

  const processBatchedText = async (text: string): Promise<string> => {
    const chunks = splitTextIntoChunks(text);
    const processedChunks: string[] = [];
    
    console.log(`Processing ${chunks.length} chunks of text`);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('process-document', {
          body: new Blob([chunks[i]], { type: 'text/plain' }),
          headers: {
            'x-file-name': 'chunk.txt',
            'content-type': 'text/plain'
          }
        });

        if (error) throw error;
        
        processedChunks.push(data.text);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
        
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        toast.error(`Error processing document chunk ${i + 1}`);
      }
    }

    return processedChunks.join(' ');
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("Please upload a valid document file");
      return;
    }

    const file = acceptedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than 2.7MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    console.log("Processing file:", file.name, "Type:", file.type, "Size:", `${(file.size / 1024).toFixed(2)}KB`);

    try {
      setIsProcessing(true);
      setProgress(0);

      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const text = await file.text();
        const processedText = await processBatchedText(text);
        
        setUploadedFile({
          text: processedText,
          name: file.name
        });
        toast.success("Text file processed successfully");
      } else {
        console.log("Sending file to edge function");
        const { data, error } = await supabase.functions.invoke('process-document', {
          body: file,
          headers: {
            'x-file-name': file.name,
            'content-type': file.type
          }
        });

        console.log("Edge function response:", { data, error });

        if (error) {
          throw new Error(`Error processing document: ${error.message}`);
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const processedText = await processBatchedText(data.text);

        setUploadedFile({
          text: processedText,
          name: data.fileName
        });
        toast.success("Document processed successfully");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(error instanceof Error ? error.message : "Error processing document");
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error(`File size must be less than 2.7MB. Current size: ${(fileRejections[0].file.size / (1024 * 1024)).toFixed(2)}MB`);
      } else {
        toast.error("Invalid file type. Please upload a PDF, DOCX, or TXT file");
      }
    }
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
                  ? `Processing document... ${progress}%`
                  : "Upload PDF, DOCX, or TXT files (max 2.7MB)"}
            </p>
            {isProcessing && (
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 bg-gray-200 rounded">
                  <div 
                    className="h-full bg-primary rounded transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
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
