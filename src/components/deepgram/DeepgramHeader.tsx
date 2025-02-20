
import { Button } from "@/components/ui/button";

interface DeepgramHeaderProps {
  onTestApiKey: () => Promise<void>;
}

export const DeepgramHeader = ({ onTestApiKey }: DeepgramHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-xl font-semibold">Deepgram Audio Processing</h2>
        <p className="text-muted-foreground mt-2">
          Upload your audio or video files for advanced speech-to-text transcription.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onTestApiKey}
      >
        Test API Key
      </Button>
    </div>
  );
};
