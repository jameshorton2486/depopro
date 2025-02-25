
import { Button } from "@/components/ui/button";

export const DeepgramHeader = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Audio Transcription</h2>
      <p className="text-muted-foreground">
        Convert your audio and video files to text using Deepgram's AI-powered transcription.
      </p>
    </div>
  );
};
