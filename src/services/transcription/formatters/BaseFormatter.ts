
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { TranscriptFormatter } from "../types";

export abstract class BaseFormatter implements TranscriptFormatter {
  protected formatTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 12);
  }

  protected getSpeakerCount(data: DeepgramResponse): number {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    return new Set(paragraphs.map(p => p.speaker)).size;
  }

  protected getAudioDuration(data: DeepgramResponse): number {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    return paragraphs.reduce((acc, para) => Math.max(acc, para.end), 0);
  }

  protected countFillerWords(data: DeepgramResponse): number {
    return data.results.channels[0].alternatives[0].words
      .filter(word => ['um', 'uh', 'ah'].includes(word.word.toLowerCase()))
      .length;
  }

  abstract format(data: DeepgramResponse): TranscriptionResult;
}
