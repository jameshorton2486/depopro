
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeepgramOptions {
  model: string;
  language: string;
  smart_format: boolean;
  punctuate: boolean;
  diarize: boolean;
  utterances: boolean;
  filler_words: boolean;
  detect_language: boolean;
}

interface TranscriptionControlsProps {
  model: string;
  language: string;
  options: DeepgramOptions;
  onModelChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onOptionsChange: (options: Partial<DeepgramOptions>) => void;
}

export const TranscriptionControls = ({
  model,
  language,
  options,
  onModelChange,
  onLanguageChange,
  onOptionsChange,
}: TranscriptionControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="w-40">
          <Select value={model} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nova-3">Nova (Best)</SelectItem>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="enhanced">Enhanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="ko">Korean</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg space-y-4">
        <h4 className="text-sm font-medium">Transcription Options</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="smart_format" 
              checked={options.smart_format}
              onCheckedChange={(checked) => 
                onOptionsChange({ smart_format: checked as boolean })
              }
            />
            <label 
              htmlFor="smart_format"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Smart Formatting
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="punctuate" 
              checked={options.punctuate}
              onCheckedChange={(checked) => 
                onOptionsChange({ punctuate: checked as boolean })
              }
            />
            <label 
              htmlFor="punctuate"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Add Punctuation
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="diarize" 
              checked={options.diarize}
              onCheckedChange={(checked) => 
                onOptionsChange({ diarize: checked as boolean })
              }
            />
            <label 
              htmlFor="diarize"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Speaker Detection
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="utterances" 
              checked={options.utterances}
              onCheckedChange={(checked) => 
                onOptionsChange({ utterances: checked as boolean })
              }
            />
            <label 
              htmlFor="utterances"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Segment Utterances
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="filler_words" 
              checked={options.filler_words}
              onCheckedChange={(checked) => 
                onOptionsChange({ filler_words: checked as boolean })
              }
            />
            <label 
              htmlFor="filler_words"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Detect Filler Words
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="detect_language" 
              checked={options.detect_language}
              onCheckedChange={(checked) => 
                onOptionsChange({ detect_language: checked as boolean })
              }
            />
            <label 
              htmlFor="detect_language"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Auto-detect Language
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
