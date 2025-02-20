
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptParagraph {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface TranscriptDisplayProps {
  transcript: string;
  paragraphs?: TranscriptParagraph[];
  onDownload: (format: 'txt' | 'docx') => void;
}

export const TranscriptDisplay = ({ transcript, paragraphs, onDownload }: TranscriptDisplayProps) => {
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
      <ScrollArea className="h-[300px] w-full rounded-md border p-4">
        {paragraphs && paragraphs.length > 0 ? (
          <div className="space-y-4">
            {paragraphs.map((para, index) => (
              <div key={index} className="space-y-1">
                <div className="text-sm font-medium text-primary">
                  {para.speaker}
                </div>
                <p className="text-sm pl-4">{para.text}</p>
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
