
import { Check } from "lucide-react";

interface SaveStatusProps {
  transcriptSaved: boolean;
  audioSaved: boolean;
  jsonSaved: boolean;
}

const SaveStatus = ({ transcriptSaved, audioSaved, jsonSaved }: SaveStatusProps) => {
  return (
    <div className="bg-muted/50 rounded-lg p-3 mb-4">
      <h3 className="text-sm font-medium mb-2">Save Status:</h3>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Check className={`w-4 h-4 ${transcriptSaved ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="text-sm">Transcript</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className={`w-4 h-4 ${audioSaved ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="text-sm">Audio</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className={`w-4 h-4 ${jsonSaved ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="text-sm">JSON</span>
        </div>
      </div>
    </div>
  );
};

export default SaveStatus;
