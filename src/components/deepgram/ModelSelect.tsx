
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectProps {
  model: string;
  onModelChange: (value: string) => void;
}

export const ModelSelect = ({ model, onModelChange }: ModelSelectProps) => {
  return (
    <div className="w-40">
      <Select value={model} onValueChange={onModelChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nova-meeting">Nova-Meeting (Diarization Enabled)</SelectItem>
          <SelectItem value="nova-3">Nova-3 (Diarization Enabled)</SelectItem>
          <SelectItem value="nova-2">Nova-2 (Diarization Enabled)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
