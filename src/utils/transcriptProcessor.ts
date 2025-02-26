
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { FormatterFactory } from "@/services/transcription/FormatterFactory";

export class TranscriptProcessor {
  private readonly STORAGE_PREFIX = 'transcript_';
  private readonly TTL = 3600;
  private formatter;

  constructor() {
    this.formatter = FormatterFactory.getFormatter("default");
  }

  processFullResponse(data: DeepgramResponse): TranscriptionResult {
    if (!data?.results?.channels?.[0]?.alternatives?.[0]?.words) {
      throw new Error('Invalid response format');
    }

    return this.formatter.format(data);
  }

  async cacheTranscript(fileHash: string, processedData: TranscriptionResult) {
    const storageKey = this.STORAGE_PREFIX + fileHash;
    sessionStorage.setItem(storageKey, JSON.stringify({
      data: processedData,
      timestamp: Date.now()
    }));
  }

  async getCachedTranscript(fileHash: string): Promise<TranscriptionResult | null> {
    const cached = sessionStorage.getItem(this.STORAGE_PREFIX + fileHash);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.TTL * 1000) {
      sessionStorage.removeItem(this.STORAGE_PREFIX + fileHash);
      return null;
    }
    
    return data;
  }
}

export const transcriptProcessor = new TranscriptProcessor();
