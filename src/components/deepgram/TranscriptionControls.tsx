
import { DeepgramOptions } from "@/types/deepgram";
import { ModelSelect } from "./ModelSelect";
import { LanguageSelect } from "./LanguageSelect";
import { TranscriptionOptions } from "./TranscriptionOptions";

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
        <ModelSelect model={model} onModelChange={onModelChange} />
        <LanguageSelect language={language} onLanguageChange={onLanguageChange} />
      </div>
      <TranscriptionOptions options={options} onOptionsChange={onOptionsChange} />
    </div>
  );
};
