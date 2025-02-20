
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
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Transcript</h3>
          {utterances && utterances.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {utterances.length} segments detected with {Array.from(new Set(utterances.map(u => u.speaker))).length} speakers
            </p>
          )}
        </div>
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

      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium">Transcript Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Duration</p>
            <p className="text-sm font-medium">{formatTime(utterances?.[utterances.length - 1]?.end || 0)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Segments</p>
            <p className="text-sm font-medium">{utterances?.length || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Speakers</p>
            <p className="text-sm font-medium">{Array.from(new Set(utterances?.map(u => u.speaker) || [])).length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg. Confidence</p>
            <p className="text-sm font-medium">
              {utterances?.length 
                ? `${Math.round((utterances.reduce((acc, u) => acc + u.confidence, 0) / utterances.length) * 100)}%`
                : 'N/A'
              }
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[500px] w-full rounded-md border">
        {utterances && utterances.length > 0 ? (
          <div className="divide-y">
            {utterances.map((utterance, index) => (
              <div key={index} className="p-4 space-y-3 hover:bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-medium">
                      {utterance.speaker}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(utterance.start)} - {formatTime(utterance.end)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={utterance.confidence > 0.9 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      Confidence: {Math.round(utterance.confidence * 100)}%
                    </Badge>
                  </div>
                </div>

                <div className="pl-4 space-y-2">
                  <p className="text-sm leading-relaxed">
                    {utterance.text}
                  </p>
                  
                  {utterance.fillerWords.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Filler words:</p>
                      <div className="flex flex-wrap gap-1">
                        {utterance.fillerWords.map((word, wordIndex) => (
                          <Badge 
                            key={wordIndex} 
                            variant="outline" 
                            className="text-xs bg-yellow-500/10"
                          >
                            {word.word} ({formatTime(word.start)})
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
          <div className="p-4">
            <p className="text-sm whitespace-pre-wrap">{transcript}</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
