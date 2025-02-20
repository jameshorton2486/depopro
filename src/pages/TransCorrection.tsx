import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { uploadAndProcessFile } from "@/services/fileProcessing";
import { openAIService } from "@/services/openai";
import { supabase } from "@/integrations/supabase/client";
import UploadArea from "@/components/transcript/UploadArea";
import FormattingButtons from "@/components/transcript/FormattingButtons";
import CorrectedTextDisplay from "@/components/transcript/CorrectedTextDisplay";

const TransCorrection = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [correctedText, setCorrectedText] = useState<string>("");
  const [uploadedText, setUploadedText] = useState<string>("");

  const processTranscript = async (text: string, useRules: boolean = true) => {
    try {
      const rules = useRules ? await openAIService.generateRulesFromSingleText(text) : {
        rules: [
          {
            type: "formatting",
            pattern: "spacing",
            correction: "Ensure proper spacing around punctuation"
          },
          {
            type: "capitalization",
            pattern: "sentence",
            correction: "Capitalize first word of sentences"
          },
          {
            type: "formatting",
            pattern: "linebreaks",
            correction: "Maintain consistent line breaks"
          }
        ]
      };
      
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
          
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error);
          failedChunks++;
          
          if (failedChunks > 3) {
            throw new Error('Too many chunk processing failures');
          }
          
          processedText += chunks[i] + ' ';
        }
      }

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
      toast.error("Please upload a valid document file (DOCX or TXT)");
      return;
    }

    const file = acceptedFiles[0];
    console.log("Processing file:", file.name, "Type:", file.type);

    try {
      setIsProcessing(true);
      setProgress(0);

      const { text } = await uploadAndProcessFile(file, setProgress);
      setUploadedFile(file);
      setUploadedText(text);
      toast.success("File uploaded and processed successfully");
      
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(error instanceof Error ? error.message : "Error processing file");
      setUploadedFile(null);
      setUploadedText("");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  }, []);

  const handleInitialFormatting = async () => {
    if (!uploadedText) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      
      const corrected = await processTranscript(uploadedText, false);
      setCorrectedText(corrected);
      
      toast.success("Initial formatting completed!");
    } catch (error) {
      console.error("Error during initial formatting:", error);
      toast.error("Error during initial formatting");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleRulesFormatting = async () => {
    if (!uploadedText) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      
      const corrected = await processTranscript(uploadedText, true);
      setCorrectedText(corrected);
      
      toast.success("Rules-based formatting completed!");
    } catch (error) {
      console.error("Error during rules-based formatting:", error);
      toast.error("Error during rules-based formatting");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  }) as {
    getRootProps: () => React.HTMLAttributes<HTMLElement>;
    getInputProps: () => DropzoneInputProps;
    isDragActive: boolean;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
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
              Upload your transcript file (DOCX or TXT) for automated correction
            </p>
          </div>

          <UploadArea
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            uploadedFile={uploadedFile}
            isProcessing={isProcessing}
            progress={progress}
          />

          {uploadedFile && !isProcessing && (
            <FormattingButtons
              onInitialFormat={handleInitialFormatting}
              onRulesFormat={handleRulesFormatting}
            />
          )}

          {correctedText && !isProcessing && (
            <CorrectedTextDisplay text={correctedText} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransCorrection;
