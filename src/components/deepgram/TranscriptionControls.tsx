
import { Button } from "@/components/ui/button";
import { DeepgramOptions } from "@/types/deepgram";
import { ModelSelect } from "./ModelSelect";
import { AdditionalOptions } from "./AdditionalOptions";
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { KeytermManagement } from "./KeytermManagement";

interface TranscriptionControlsProps {
  model: string;
  options: DeepgramOptions;
  onModelChange: (value: string) => void;
  onOptionsChange: (options: Partial<DeepgramOptions>) => void;
  handleTranscribe: () => void;
  isProcessing: boolean;
  progress: number;
}

export const TranscriptionControls = ({
  model,
  options,
  onModelChange,
  onOptionsChange,
  handleTranscribe,
  isProcessing,
  progress
}: TranscriptionControlsProps) => (
  <div className="space-y-6">
    <div className="flex gap-4">
      <ModelSelect model={model} onModelChange={onModelChange} />
    </div>
    
    <AdditionalOptions options={options} onOptionsChange={onOptionsChange} />

    <KeytermManagement onKeytermsChange={(keyterms) => 
      onOptionsChange({ keyterms })
    } />
    
    {isProcessing && (
      <div className="w-full space-y-2">
        <Progress value={progress} className="w-full h-2" />
        <p className="text-sm text-center text-muted-foreground">
          {progress}%
        </p>
      </div>
    )}
    
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
