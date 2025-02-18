
import React, { useState, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

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
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      onTimeUpdate?.(audioRef.current.currentTime);
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
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {formatTime(currentTime)}
            </span>
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
            <span className="text-sm text-muted-foreground">
              {audioRef.current?.duration ? formatTime(audioRef.current.duration) : "00:00"}
            </span>
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
