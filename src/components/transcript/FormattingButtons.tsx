
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { TranscriptFormatting } from "@/types/deepgram";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";

interface FormattingButtonsProps {
  transcript: string;
}

const FormattingButtons = ({ transcript }: FormattingButtonsProps) => {
  const [formatting, setFormatting] = useState<TranscriptFormatting>({
    removeExtraSpaces: true,
    standardizePunctuation: true,
    boldSpeakerNames: true,
    highlightFillerWords: true,
    enableDiarization: true,
    enableParagraphs: true
  });

  const handleFormatting = () => {
    if (!transcript) {
      toast.error("No transcript to format");
      return;
    }
    
    createAndDownloadWordDoc(transcript, formatting);
    toast.success("Document formatted and downloaded");
  };

  return (
    <div className="border rounded-lg p-4 space-y-6">
      <h3 className="font-semibold text-lg">Formatting Options</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Diarization</Label>
            <p className="text-sm text-muted-foreground">
              Separate and label different speakers in the transcript
            </p>
          </div>
          <Switch
            checked={formatting.enableDiarization}
            onCheckedChange={(checked) => 
              setFormatting(prev => ({ ...prev, enableDiarization: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Paragraphs</Label>
            <p className="text-sm text-muted-foreground">
              Format text into logical paragraphs
            </p>
          </div>
          <Switch
            checked={formatting.enableParagraphs}
            onCheckedChange={(checked) => 
              setFormatting(prev => ({ ...prev, enableParagraphs: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Remove Extra Spaces</Label>
            <p className="text-sm text-muted-foreground">
              Clean up excessive whitespace and line breaks
            </p>
          </div>
          <Switch
            checked={formatting.removeExtraSpaces}
            onCheckedChange={(checked) => 
              setFormatting(prev => ({ ...prev, removeExtraSpaces: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Standardize Punctuation</Label>
            <p className="text-sm text-muted-foreground">
              Ensure consistent spacing after periods, commas, etc.
            </p>
          </div>
          <Switch
            checked={formatting.standardizePunctuation}
            onCheckedChange={(checked) => 
              setFormatting(prev => ({ ...prev, standardizePunctuation: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Bold Speaker Names</Label>
            <p className="text-sm text-muted-foreground">
              Make speaker labels stand out in bold
            </p>
          </div>
          <Switch
            checked={formatting.boldSpeakerNames}
            onCheckedChange={(checked) => 
              setFormatting(prev => ({ ...prev, boldSpeakerNames: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Highlight Filler Words</Label>
            <p className="text-sm text-muted-foreground">
              Emphasize words like "um", "uh", "like"
            </p>
          </div>
          <Switch
            checked={formatting.highlightFillerWords}
            onCheckedChange={(checked) => 
              setFormatting(prev => ({ ...prev, highlightFillerWords: checked }))
            }
          />
        </div>
      </div>

      <Button 
        onClick={handleFormatting}
        className="w-full"
      >
        <Check className="w-4 h-4 mr-2" />
        Format Document
      </Button>
    </div>
  );
};

export default FormattingButtons;
