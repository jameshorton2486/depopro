
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const DeepgramHeader = () => {
  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Choose a model and language, then upload an audio file to begin transcription.
      </AlertDescription>
    </Alert>
  );
};
