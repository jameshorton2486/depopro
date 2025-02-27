
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { FormatterFactory } from "@/services/transcription/FormatterFactory";

export class TranscriptProcessor {
  private formatter;

  constructor() {
    this.formatter = FormatterFactory.getFormatter("default");
  }

  processFullResponse(data: DeepgramResponse): TranscriptionResult {
    try {
      console.log('Processing Deepgram response:', data);
      
      if (!data?.results?.channels?.[0]?.alternatives?.[0]) {
        throw new Error('Invalid response format from Deepgram');
      }

      const alternative = data.results.channels[0].alternatives[0];
      const paragraphs = alternative.paragraphs?.paragraphs || [];
      
      return {
        transcript: alternative.transcript,
        paragraphs: paragraphs,
        metadata: {
          processingTime: data.metadata.processing_time,
          audioLength: data.metadata.duration,
          speakers: this.countSpeakers(paragraphs),
          fillerWords: this.countFillerWords(alternative.transcript)
        }
      };
    } catch (error) {
      console.error('Error processing transcript:', error);
      throw error;
    }
  }

  private countSpeakers(paragraphs: any[]): number {
    const speakers = new Set(paragraphs.map(p => p.speaker));
    return speakers.size;
  }

  private countFillerWords(transcript: string): number {
    const fillerWords = ['um', 'uh', 'ah', 'er', 'like', 'you know'];
    const words = transcript.toLowerCase().split(' ');
    return words.filter(word => fillerWords.includes(word)).length;
  }
}

export const transcriptProcessor = new TranscriptProcessor();
