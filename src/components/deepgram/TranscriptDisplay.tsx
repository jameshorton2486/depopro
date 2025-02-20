
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

export const TranscriptDisplay = ({ transcript, utterances = [], onDownload }: TranscriptDisplayProps) => {
  if (!transcript) return null;

  const hasUtterances = Array.isArray(utterances) && utterances.length > 0;
  const speakerCount = hasUtterances 
    ? Array.from(new Set(utterances.map(u => u.speaker))).length 
    : 0;
  const avgConfidence = hasUtterances
    ? Math.round((utterances.reduce((acc, u) => acc + u.confidence, 0) / utterances.length) * 100)
    : 0;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Transcript</h3>
          {hasUtterances && (
            <p className="text-sm text-muted-foreground">
              {utterances.length} segments detected with {speakerCount} speakers
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

      {hasUtterances && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium">Transcript Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Duration</p>
              <p className="text-sm font-medium">
                {formatTime(utterances[utterances.length - 1]?.end || 0)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Segments</p>
              <p className="text-sm font-medium">{utterances.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Speakers</p>
              <p className="text-sm font-medium">{speakerCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Avg. Confidence</p>
              <p className="text-sm font-medium">
                {avgConfidence ? `${avgConfidence}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      <ScrollArea className="h-[500px] w-full rounded-md border p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {transcript}
        </pre>
      </ScrollArea>
    </div>
  );
};
