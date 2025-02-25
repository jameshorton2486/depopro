
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";
import { FormatterFactory, FormatterType } from "@/services/transcription/FormatterFactory";

export class TranscriptProcessor {
  private readonly STORAGE_PREFIX = 'transcript_';
  private readonly TTL = 3600; // 1 hour in seconds
  private formatter;

  constructor(formatterType: FormatterType = "default") {
    this.formatter = FormatterFactory.getFormatter(formatterType);
  }

  processFullResponse(data: DeepgramResponse): TranscriptionResult {
    this.validateDiarization(data);
    return this.formatter.format(data);
  }

  private validateDiarization(response: DeepgramResponse) {
    if (!response?.results?.channels?.[0]?.alternatives?.[0]?.words) {
      throw new Error('Invalid response format: Missing words array');
    }

    const words = response.results.channels[0].alternatives[0].words;
    const speakers = new Set(words.map(w => w.speaker).filter(Boolean));
    const speakerChanges = words
      .map(w => w.speaker)
      .filter((s, i, arr) => i === 0 || s !== arr[i-1])
      .length;

    if (speakers.size < 2) {
      console.warn('Single speaker detected - verify if this is expected');
    }

    if (speakerChanges < 2) {
      throw new Error('Insufficient speaker differentiation - check audio quality');
    }

    // Log diarization quality metrics
    console.debug('Diarization metrics:', {
      uniqueSpeakers: speakers.size,
      speakerChanges,
      totalWords: words.length,
      avgWordsPerSpeaker: words.length / speakers.size
    });
  }

  formatTime(seconds: number): string {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 12);
  }

  private countFillerWords(words: Array<{ word: string }>): number {
    const fillerWords = ['um', 'uh', 'ah'];
    return words.filter(word => 
      fillerWords.includes(word.word.toLowerCase())
    ).length;
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
}

export const transcriptProcessor = new TranscriptProcessor();
