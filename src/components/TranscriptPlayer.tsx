
import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Filter } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

interface TimestampedWord {
  start_time: string;
  end_time: string;
  word: string;
  confidence: number;
}

interface TranscriptPlayerProps {
  audioUrl?: string;
  words: TimestampedWord[];
  onTimeUpdate?: (time: number) => void;
}

const TranscriptPlayer = ({ audioUrl, words, onTimeUpdate }: TranscriptPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const timeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / duration) * 100);
      onTimeUpdate?.(current);
    }
  };

  const handleWordClick = (startTime: string) => {
    if (audioRef.current) {
      const seconds = timeToSeconds(startTime);
      audioRef.current.currentTime = seconds;
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - bounds.left) / bounds.width;
      const newTime = audioRef.current.duration * percent;
      audioRef.current.currentTime = newTime;
    }
  };

  return (
    <div className="bg-background border rounded-lg p-4 space-y-4">
      {audioUrl ? (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium min-w-[48px]">
              {formatTime(currentTime)}
            </span>
            
            <div 
              className="flex-1 cursor-pointer"
              onClick={handleProgressClick}
            >
              <Progress value={progress} className="h-2" />
            </div>
            
            <span className="text-sm text-muted-foreground min-w-[48px]">
              {audioRef.current?.duration ? formatTime(audioRef.current.duration) : "00:00"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={showLowConfidence}
                onCheckedChange={setShowLowConfidence}
                id="show-low-confidence"
              />
              <label htmlFor="show-low-confidence" className="text-sm">
                Show low confidence only
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => skip(-5)}
                className="p-2 rounded-full hover:bg-secondary"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => skip(5)}
                className="p-2 rounded-full hover:bg-secondary"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            {words
              .filter(word => !showLowConfidence || word.confidence < 0.9)
              .map((word, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        onClick={() => handleWordClick(word.start_time)}
                        className={`inline-block mr-1 cursor-pointer px-1 rounded hover:bg-secondary ${
                          word.confidence < 0.9 ? 'bg-yellow-200/50' : ''
                        }`}
                      >
                        {word.word}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confidence: {(word.confidence * 100).toFixed(1)}%</p>
                      <p>Time: {word.start_time}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground">
          No audio file available
        </div>
      )}
    </div>
  );
};

export default TranscriptPlayer;
