
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  type?: 'filler' | undefined;
}

interface TranscriptUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words: Word[];
  fillerWords: Word[];
}

interface TranscriptDisplayProps {
  transcript: string;
  utterances?: TranscriptUtterance[];
  onDownload: (format: 'txt' | 'docx') => void;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const TranscriptDisplay = ({ transcript, utterances, onDownload }: TranscriptDisplayProps) => {
  if (!transcript) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Transcript</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload('txt')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download as TXT
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload('docx')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download as DOCX
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[500px] w-full rounded-md border p-4">
        {utterances && utterances.length > 0 ? (
          <div className="space-y-6">
            {utterances.map((utterance, index) => (
              <div key={index} className="space-y-2 border-b pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {utterance.speaker}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(utterance.start)} - {formatTime(utterance.end)}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    Confidence: {Math.round(utterance.confidence * 100)}%
                  </Badge>
                </div>
                <div className="pl-4">
                  <p className="text-sm leading-relaxed">
                    {utterance.text}
                  </p>
                  {utterance.fillerWords.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Filler words detected:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {utterance.fillerWords.map((word, wordIndex) => (
                          <Badge key={wordIndex} variant="outline" className="text-xs">
                            {word.word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm">{transcript}</p>
        )}
      </ScrollArea>
    </div>
  );
};
