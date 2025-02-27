
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Youtube, Globe } from "lucide-react";

interface UrlInputProps {
  audioUrl: string;
  handleUrlChange: (url: string) => void;
  isYouTubeUrl: (url: string) => boolean;
  disabled?: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  audioUrl,
  handleUrlChange,
  isYouTubeUrl,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(audioUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUrlChange(inputValue);
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="url"
            placeholder="Enter YouTube URL or audio file URL"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {inputValue && isYouTubeUrl(inputValue) ? (
              <Youtube className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </div>
        </div>
        <Button 
          type="submit" 
          variant="outline" 
          disabled={disabled || !inputValue}
        >
          Use URL
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        {isYouTubeUrl(inputValue) 
          ? "YouTube videos will be processed to extract audio for transcription" 
          : "Direct audio or video URL (MP3, WAV, MP4, etc.)"}
      </p>
    </div>
  );
};
