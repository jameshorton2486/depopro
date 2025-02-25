
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileJson, FileText } from "lucide-react";

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

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <Label className="text-lg font-medium">Transcript</Label>
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
      <div className="flex justify-end">
        <Button
          onClick={onGenerateRules}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Generate Rules
        </Button>
      </div>
    </div>
  );
};

export default TextComparison;
