
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

  processFullResponse(data: DeepgramResponse): TranscriptionResult {
    if (!data?.results?.channels?.[0]?.alternatives?.[0]?.words) {
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
    
    // Update in-memory cache
    this.cache.set(fileHash, cacheData);
    
    // Update session storage
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to session storage:', error);
    }
  }

  async getCachedTranscript(fileHash: string): Promise<TranscriptionResult | null> {
    // Check in-memory cache first
    const memoryCache = this.cache.get(fileHash);
    if (memoryCache && Date.now() - memoryCache.timestamp <= this.TTL * 1000) {
      return memoryCache.data;
    }
    
    // Check session storage if not in memory
    try {
      const cached = sessionStorage.getItem(this.STORAGE_PREFIX + fileHash);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.TTL * 1000) {
        sessionStorage.removeItem(this.STORAGE_PREFIX + fileHash);
        return null;
      }
      
      // Update in-memory cache
      this.cache.set(fileHash, { data, timestamp });
      return data;
    } catch (error) {
      console.warn('Failed to retrieve from session storage:', error);
      return null;
    }
  }
}

export const transcriptProcessor = new TranscriptProcessor();
