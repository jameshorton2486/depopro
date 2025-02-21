
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const DeepgramHeader = () => {
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("DEEPGRAM_API_KEY");
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    localStorage.setItem("DEEPGRAM_API_KEY", apiKey.trim());
    setIsEditing(false);
    toast.success("API key saved successfully");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Deepgram Transcription</h1>
      <p className="text-muted-foreground">
        Convert your audio and video files to text using Deepgram's AI-powered transcription.
      </p>
      
      <div className="flex items-center gap-4">
        {isEditing ? (
          <>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Deepgram API key"
              className="max-w-md"
            />
            <Button onClick={handleSaveKey}>Save Key</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            {apiKey ? "Change API Key" : "Set API Key"}
          </Button>
        )}
      </div>
      
      {!apiKey && (
        <p className="text-sm text-yellow-600">
          Please set your Deepgram API key to start transcribing.
          You can get one from{" "}
          <a
            href="https://console.deepgram.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-700"
          >
            Deepgram's Console
          </a>
          .
        </p>
      )}
    </div>
  );
};
