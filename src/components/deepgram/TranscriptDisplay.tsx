
import React, { useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { TranscriptionResult, DeepgramParagraph } from "@/types/deepgram";
import FormattingButtons from "@/components/transcript/FormattingButtons";

interface TranscriptDisplayProps {
  transcript: string;
  transcriptionResult?: TranscriptionResult | null;
  onDownload: (transcript: string) => void;
}

export const TranscriptDisplay = ({ 
  transcript, 
  transcriptionResult, 
  onDownload 
}: TranscriptDisplayProps) => {
  if (!transcript) return null;

  const handleTranscriptComplete = () => {
    onDownload(transcript);
  };

  useEffect(() => {
    if (transcript) {
      handleTranscriptComplete();
    }
  }, [transcript]);

  // Create a speaker mapping that starts from 0
  const speakerMap = new Map<number, number>();
  let nextSpeakerNumber = 0;

  const getSpeakerNumber = (originalSpeaker: number) => {
    // Handle undefined or invalid speaker numbers
    const validSpeaker = isNaN(originalSpeaker) ? 0 : originalSpeaker;
    
    if (!speakerMap.has(validSpeaker)) {
      speakerMap.set(validSpeaker, nextSpeakerNumber++);
    }
    return speakerMap.get(validSpeaker) ?? 0;
  };

  const renderParagraph = (paragraph: DeepgramParagraph, index: number) => {
    // Ensure speaker number is valid
    const speakerNumber = getSpeakerNumber(paragraph.speaker ?? 0);
    
    return (
      <div key={index} className="mb-4">
        <div className="text-sm font-medium mb-1 text-blue-600">
          Speaker {speakerNumber}
        </div>
        <p className="text-sm leading-relaxed">
          {paragraph.sentences.map((sentence, i) => (
            <span key={i} className="inline-block">
              {sentence.text}{' '}
            </span>
          ))}
        </p>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Transcript</h3>
          {transcriptionResult?.metadata && (
            <div className="text-sm text-muted-foreground">
              {transcriptionResult.metadata.speakers || 1} speakers • 
              {Math.round(transcriptionResult.metadata.audioLength || 0)} seconds
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => createAndDownloadWordDoc(transcript)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Raw
          </Button>
        </div>
      </div>

      <FormattingButtons transcript={transcript} />

      <ScrollArea className="h-[500px] w-full rounded-md border p-4">
        {transcriptionResult?.paragraphs ? (
          <div className="space-y-6">
            {transcriptionResult.paragraphs.map((paragraph, index) => 
              renderParagraph(paragraph, index)
            )}
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {transcript}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
};
