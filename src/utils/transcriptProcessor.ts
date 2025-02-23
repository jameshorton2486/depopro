
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";

export class TranscriptProcessor {
  private readonly STORAGE_PREFIX = 'transcript_';
  private readonly TTL = 3600; // 1 hour in seconds

  processFullResponse(data: DeepgramResponse): TranscriptionResult {
    const formattedTranscript = this.formatTranscript(data);
    const metadata = this.extractMetadata(data);
    
    return {
      transcript: data.results.channels[0].alternatives[0].transcript,
      paragraphs: data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [],
      metadata: {
        processingTime: data.metadata.processing_time,
        audioLength: metadata.duration,
        speakers: metadata.speakers,
        fillerWords: metadata.fillerWords
      }
    };
  }

  private formatTranscript(data: DeepgramResponse): string {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    return paragraphs
      .map(para => {
        const speaker = `Speaker ${para.speaker + 1}`;
        const timestamp = this.formatTime(para.start);
        const content = para.sentences.map(s => s.text).join(' ');
        
        return `${timestamp} ${speaker}:\n${content}\n`;
      }).join('\n');
  }

  private extractMetadata(data: DeepgramResponse) {
    return {
      speakers: this.getSpeakerCount(data),
      duration: this.getAudioDuration(data),
      paragraphs: data.results.channels[0].alternatives[0].paragraphs?.paragraphs.length || 0,
      fillerWords: this.countFillerWords(data)
    };
  }

  private formatTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 12);
  }

  async cacheTranscript(fileHash: string, processedData: TranscriptionResult) {
    const storageKey = this.STORAGE_PREFIX + fileHash;
    const dataToStore = {
      data: processedData,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(storageKey, JSON.stringify(dataToStore));
  }

  async getCachedTranscript(fileHash: string): Promise<TranscriptionResult | null> {
    const storageKey = this.STORAGE_PREFIX + fileHash;
    const cached = sessionStorage.getItem(storageKey);
    
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.TTL * 1000) {
      sessionStorage.removeItem(storageKey);
      return null;
    }
    
    return data;
  }

  private getSpeakerCount(data: DeepgramResponse): number {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    return new Set(paragraphs.map(p => p.speaker)).size;
  }

  private getAudioDuration(data: DeepgramResponse): number {
    const paragraphs = data.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
    return paragraphs.reduce((acc, para) => Math.max(acc, para.end), 0);
  }

  private countFillerWords(data: DeepgramResponse): number {
    return data.results.channels[0].alternatives[0].words
      .filter(word => ['um', 'uh', 'ah'].includes(word.word.toLowerCase()))
      .length;
  }
}

export const transcriptProcessor = new TranscriptProcessor();
