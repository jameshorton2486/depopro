
import { Button } from "@/components/ui/button";
import { DeepgramOptions } from "@/types/deepgram";
import { ModelSelect } from "./ModelSelect";
import { LanguageSelect } from "./LanguageSelect";
import { AdditionalOptions } from "./AdditionalOptions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface TranscriptionControlsProps {
  model: string;
  language: string;
  options: DeepgramOptions;
  onModelChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onOptionsChange: (options: Partial<DeepgramOptions>) => void;
  handleTranscribe: () => void;
  isProcessing: boolean;
  progress: number;
}

export const TranscriptionControls = ({
  model,
  language,
  options,
  onModelChange,
  onLanguageChange,
  onOptionsChange,
  handleTranscribe,
  isProcessing,
  progress
}: TranscriptionControlsProps) => {
  const handleModelChange = (value: string) => {
    onModelChange(value);
    toast.success(`Model changed to ${value}`);
  };

  const handleLanguageChange = (value: string) => {
    onLanguageChange(value);
    toast.success(`Language changed to ${value}`);
  };

  const handleTranscribeClick = () => {
    toast.info('Starting transcription process...');
    handleTranscribe();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <ModelSelect model={model} onModelChange={handleModelChange} />
        <LanguageSelect language={language} onLanguageChange={handleLanguageChange} />
      </div>
      
      <AdditionalOptions options={options} onOptionsChange={onOptionsChange} />
      
      {isProcessing && (
        <div className="w-full space-y-2">
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Processing: {progress}%
          </p>
        </div>
      )}
      
      <Button 
        onClick={handleTranscribeClick} 
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
