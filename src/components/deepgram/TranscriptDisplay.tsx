
import React, { useEffect, useMemo } from "react";
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

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ 
  transcript, 
  transcriptionResult, 
  onDownload 
}) => {
  // Move hooks to the top level
  const { speakerMap, getSpeakerNumber } = useMemo(() => {
    const map = new Map<number, number>();
    let nextNumber = 0;

    const getNumber = (speaker: number | undefined): number => {
      const validSpeaker = speaker ?? 0;
      if (!map.has(validSpeaker)) {
        map.set(validSpeaker, nextNumber++);
      }
      return map.get(validSpeaker) ?? 0;
    };

    return {
      speakerMap: map,
      getSpeakerNumber: getNumber
    };
  }, []);

  useEffect(() => {
    if (transcript) {
      onDownload(transcript);
    }
  }, [transcript, onDownload]);

  const renderParagraph = React.useCallback((paragraph: DeepgramParagraph, index: number) => {
    const speakerNumber = getSpeakerNumber(paragraph.speaker);
    
    return (
      <div key={`paragraph-${index}`} className="mb-4">
        <div className="text-sm font-medium mb-1 text-blue-600">
          Speaker {speakerNumber}:
        </div>
        <p className="text-sm leading-relaxed">
          {paragraph.sentences.map((sentence, i) => (
            <span key={`sentence-${index}-${i}`} className="inline-block">
              {sentence.text}{' '}
            </span>
          ))}
        </p>
      </div>
    );
  }, [getSpeakerNumber]);

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
          {transcript && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => createAndDownloadWordDoc(transcript)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Raw
            </Button>
          )}
        </div>
      </div>

      {transcript && (
        <>
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
        </>
      )}
    </div>
  );
};
