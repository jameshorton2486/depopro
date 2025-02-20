
import { Link } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UploadProgress from "@/components/upload/UploadProgress";
import { uploadAndProcessFile } from "@/services/fileProcessing";
import { openAIService } from "@/services/openai";
import { supabase } from "@/integrations/supabase/client";

const TransCorrection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [correctedText, setCorrectedText] = useState<string>("");

  const processTranscript = async (text: string) => {
    try {
      // Get the training rules
      const rules = await openAIService.generateRulesFromSingleText(text);
      
      // Process the text in chunks to avoid rate limits
      const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
      let processedText = '';
      let failedChunks = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        try {
          setProgress(Math.round((i / chunks.length) * 100));
          
          const { data, error } = await supabase.functions.invoke('process-transcript', {
            body: { text: chunks[i], rules }
          });

          if (error) throw error;
          processedText += data.correctedText + ' ';
          
          // Add small delay between chunks
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error);
          failedChunks++;
          
          if (failedChunks > 3) {
            throw new Error('Too many chunk processing failures');
          }
          
          // Use original text for failed chunk
          processedText += chunks[i] + ' ';
        }
      }

      // Validate final output
      if (processedText.length < text.length * 0.9) {
        throw new Error('Significant content loss detected during processing');
      }

      return processedText.trim();
    } catch (error) {
      console.error('Error processing transcript:', error);
      throw error;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("Please upload a valid document file");
      return;
    }

    const file = acceptedFiles[0];
    console.log("Processing file:", file.name, "Type:", file.type);

    try {
      setIsProcessing(true);
      setProgress(0);

      // Upload and process the file
      const { text } = await uploadAndProcessFile(file, setProgress);
      setUploadedFile(file);

      toast.success("File uploaded successfully. Starting correction process...");
      
      // Process the transcript
      const corrected = await processTranscript(text);
      setCorrectedText(corrected);
      
      toast.success("Transcript correction completed!");
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
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/upload" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Link>
          <h1 className="text-2xl font-bold">Transcript Correction</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Upload Transcript for Correction</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your transcript file (PDF, DOCX, or TXT) for automated correction
            </p>
          </div>

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
                  Supports PDF, DOCX, and TXT files
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="w-full max-w-xs mt-4">
                <UploadProgress progress={progress} />
              </div>
            )}
          </div>

          {correctedText && !isProcessing && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Corrected Transcript</h3>
              <div className="p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{correctedText}</pre>
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(correctedText);
                    toast.success("Copied to clipboard!");
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransCorrection;
