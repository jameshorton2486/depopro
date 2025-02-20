
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptDisplayProps {
  transcript: string;
  onDownload: (format: 'txt' | 'docx') => void;
}

export const TranscriptDisplay = ({ transcript, onDownload }: TranscriptDisplayProps) => {
  if (!transcript) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Transcript</h3>
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

      <ScrollArea className="h-[500px] w-full rounded-md border p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {transcript}
        </pre>
      </ScrollArea>
    </div>
  );
};
