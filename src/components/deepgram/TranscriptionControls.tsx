
import { Button } from "@/components/ui/button";
import { DeepgramOptions } from "@/types/deepgram";
import { ModelSelect } from "./ModelSelect";
import { LanguageSelect } from "./LanguageSelect";
import { Loader2 } from "lucide-react";

interface TranscriptionControlsProps {
  model: string;
  language: string;
  options: DeepgramOptions;
  onModelChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onOptionsChange: (options: Partial<DeepgramOptions>) => void;
  handleTranscribe: () => void;
  isProcessing: boolean;
}

export const TranscriptionControls = ({
  model,
  language,
  options,
  onModelChange,
  onLanguageChange,
  onOptionsChange,
  handleTranscribe,
  isProcessing
}: TranscriptionControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <ModelSelect model={model} onModelChange={onModelChange} />
        <LanguageSelect language={language} onLanguageChange={onLanguageChange} />
      </div>
      <Button 
        onClick={handleTranscribe} 
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Start Transcription'
        )}
      </Button>
    </div>
  );
};
