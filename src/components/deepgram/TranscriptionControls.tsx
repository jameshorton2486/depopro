
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TranscriptionControlsProps {
  model: string;
  language: string;
  onModelChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
}

export const TranscriptionControls = ({
  model,
  language,
  onModelChange,
  onLanguageChange,
}: TranscriptionControlsProps) => {
  return (
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
  );
};
