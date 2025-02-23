
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { BaseFormatter } from "./BaseFormatter";

export class DefaultFormatter extends BaseFormatter {
  format(data: DeepgramResponse): TranscriptionResult {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    
    return {
      transcript: data.results.channels[0].alternatives[0].transcript,
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
