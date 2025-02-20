
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { uploadAndProcessFile } from "@/services/fileProcessing";
import { processTranscript } from "@/services/transcriptProcessing";

export const useTranscriptUpload = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [correctedText, setCorrectedText] = useState<string>("");
  const [uploadedText, setUploadedText] = useState<string>("");

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

  return {
    isProcessing,
    progress,
    uploadedFile,
    correctedText,
    onDrop,
    handleInitialFormatting,
    handleRulesFormatting
  };
};
