
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
          <SelectItem value="nova-meeting">Nova-Meeting</SelectItem>
          <SelectItem value="nova-3">Nova-3 (Latest)</SelectItem>
          <SelectItem value="nova-2">Nova-2</SelectItem>
          <SelectItem value="nova-2-medical">Nova-2-Medical</SelectItem>
          <SelectItem value="base">Base</SelectItem>
          <SelectItem value="enhanced">Enhanced</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
