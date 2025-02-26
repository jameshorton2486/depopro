
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, FileOutput, FileCheck, Loader2 } from "lucide-react";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { type TrainingRules } from "@/services/openai";
import { useTranscriptProcessing } from "@/hooks/useTranscriptProcessing";
import { useMemo } from "react";

type TextComparisonProps = {
  originalText: string;
  correctedText: string;
  onOriginalTextChange: (text: string) => void;
  onCorrectedTextChange: (text: string) => void;
  onGenerateRules: () => void;
};

const TextComparison = ({
  originalText,
  correctedText,
  onOriginalTextChange,
  onCorrectedTextChange,
  onGenerateRules
}: TextComparisonProps) => {
  const { isProcessing, processTranscript, validateJson } = useTranscriptProcessing();

  const handleExportToWord = () => {
    if (!correctedText) {
      toast.error("Please enter some text in the transcript box first");
      return;
    }
    
    try {
      createAndDownloadWordDoc(correctedText);
      toast.success("Document created and opened successfully");
    } catch (error) {
      toast.error("Failed to create document");
      console.error("Document creation error:", error);
    }
  };

  const handleCorrectTranscript = async () => {
    if (!correctedText || !originalText) {
      toast.error("Please provide both transcript and JSON corrections");
      return;
    }

    await processTranscript(correctedText, originalText);
  };

  // Memoize the JSON validation handler
  const handleJsonChange = useMemo(() => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onOriginalTextChange(e.target.value);
    if (e.target.value) validateJson(e.target.value);
  }, [onOriginalTextChange, validateJson]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <Label className="text-lg font-medium">Transcript</Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToWord}
              className="flex items-center gap-2"
              disabled={isProcessing}
            >
              <FileOutput className="h-4 w-4" />
              Export to Word
            </Button>
          </div>
          <Textarea
            className="min-h-[288px]"
            placeholder="Paste the transcript that needs correction here..."
            value={correctedText}
            onChange={(e) => onCorrectedTextChange(e.target.value)}
            disabled={isProcessing}
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileJson className="h-5 w-5 text-blue-500" />
            <Label className="text-lg font-medium">JSON File</Label>
          </div>
          <Textarea
            className="min-h-[288px] font-mono"
            placeholder="Paste the original JSON here..."
            value={originalText}
            onChange={handleJsonChange}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleCorrectTranscript}
          className="bg-blue-500 text-white hover:bg-blue-600 gap-2"
          size="lg"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <FileCheck className="h-5 w-5" />
          )}
          {isProcessing ? 'Processing...' : 'Correct Transcript'}
        </Button>
      </div>
    </div>
  );
};

export default TextComparison;
