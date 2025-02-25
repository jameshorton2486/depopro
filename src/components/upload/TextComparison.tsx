
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, FileOutput } from "lucide-react";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";

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
  const validateJson = (text: string) => {
    try {
      JSON.parse(text);
      toast.success("Valid JSON format");
    } catch (e) {
      toast.error("Invalid JSON format");
    }
  };

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
            onChange={(e) => {
              onOriginalTextChange(e.target.value);
              if (e.target.value) validateJson(e.target.value);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TextComparison;
