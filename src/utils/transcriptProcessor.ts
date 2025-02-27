
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { FormatterFactory } from "@/services/transcription/FormatterFactory";

export class TranscriptProcessor {
  private readonly STORAGE_PREFIX = 'transcript_';
  private readonly TTL = 3600;
  private formatter;
  private cache: Map<string, { data: TranscriptionResult; timestamp: number }>;

  constructor() {
    this.formatter = FormatterFactory.getFormatter("default");
    this.cache = new Map();
  }

  async generateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  processFullResponse(data: DeepgramResponse): TranscriptionResult {
    if (!data?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response format');
    }

    return this.formatter.format(data);
  }

  async cacheTranscript(fileHash: string, processedData: TranscriptionResult) {
    const storageKey = this.STORAGE_PREFIX + fileHash;
    const cacheData = {
      data: processedData,
      timestamp: Date.now()
    };
    
    this.cache.set(fileHash, cacheData);
    
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to session storage:', error);
    }
  }

  async getCachedTranscript(fileHash: string): Promise<TranscriptionResult | null> {
    const memoryCache = this.cache.get(fileHash);
    if (memoryCache && Date.now() - memoryCache.timestamp <= this.TTL * 1000) {
      return memoryCache.data;
    }
    
    try {
      const cached = sessionStorage.getItem(this.STORAGE_PREFIX + fileHash);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.TTL * 1000) {
        sessionStorage.removeItem(this.STORAGE_PREFIX + fileHash);
        return null;
      }
      
      this.cache.set(fileHash, { data, timestamp });
      return data;
    } catch (error) {
      console.warn('Failed to retrieve from session storage:', error);
      return null;
    }
  }
}

export const transcriptProcessor = new TranscriptProcessor();
