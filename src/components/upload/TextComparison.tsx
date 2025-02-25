
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, FileOutput, FileCheck } from "lucide-react";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { type TrainingRules } from "@/services/openai";

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

  const handleCorrectTranscript = async () => {
    if (!correctedText) {
      toast.error("Please enter some text in the transcript box first");
      return;
    }

    if (!originalText) {
      toast.error("Please provide the JSON corrections file");
      return;
    }

    try {
      const corrections = JSON.parse(originalText) as TrainingRules;
      
      // Make API call to apply corrections using training model
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a professional transcript corrector. Apply these specific rules and instructions:
                ${JSON.stringify(corrections, null, 2)}`
            },
            {
              role: "user",
              content: correctedText
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process corrections');
      }

      const data = await response.json();
      const correctedTranscript = data.choices[0].message.content;

      // Create and open Word document with corrected text
      createAndDownloadWordDoc(correctedTranscript);
      toast.success("Transcript corrected and saved as Word document");
    } catch (error) {
      toast.error("Failed to process corrections. Please check the JSON format.");
      console.error("Correction processing error:", error);
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

      <div className="flex justify-center">
        <Button
          onClick={handleCorrectTranscript}
          className="bg-blue-500 text-white hover:bg-blue-600 gap-2"
          size="lg"
        >
          <FileCheck className="h-5 w-5" />
          Correct Transcript
        </Button>
      </div>
    </div>
  );
};

export default TextComparison;
