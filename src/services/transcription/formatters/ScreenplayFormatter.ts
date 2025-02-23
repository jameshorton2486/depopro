
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { BaseFormatter } from "./BaseFormatter";

export class ScreenplayFormatter extends BaseFormatter {
  format(data: DeepgramResponse): TranscriptionResult {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    let formattedTranscript = "";

    paragraphs.forEach((para, index) => {
      const speaker = `Speaker ${para.speaker + 1}:`;
      formattedTranscript += `\n${speaker}\n`;
      
      para.sentences.forEach(sentence => {
        formattedTranscript += `    ${sentence.text}\n`;
      });
      
      if (index < paragraphs.length - 1) {
        formattedTranscript += "\n";
      }
    });

    return {
      transcript: formattedTranscript.trim(),
      paragraphs: paragraphs,
      metadata: {
        processingTime: data.metadata.processing_time,
        audioLength: this.getAudioDuration(data),
        speakers: this.getSpeakerCount(data),
        fillerWords: this.countFillerWords(data)
      }
    };
  }
}
