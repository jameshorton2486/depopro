
import { DeepgramResponse, DeepgramParagraph } from "@/types/deepgram";
import { toast } from "sonner";

interface AudioChunkMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
}

interface WordWithSpeaker {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
}

export const processChunkWithRetry = async (
  chunk: ArrayBuffer,
  retries = 3
): Promise<ArrayBuffer> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await processAudioChunk(chunk);
    } catch (error) {
      console.error(`Processing attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error("Failed to process audio chunk after multiple attempts");
};

export const processAudioChunk = (chunk: ArrayBuffer): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Basic audio processing logic
      resolve(chunk);
    } catch (error) {
      reject(error);
    }
  });
};

export const extractMetadata = (audio: ArrayBuffer): AudioChunkMetadata => {
  // Basic metadata extraction
  return {
    duration: 0,
    sampleRate: 44100,
    channels: 2
  };
};

export const findSpeakerForTimeRange = (
  start: number,
  end: number,
  paragraphs: DeepgramParagraph[]
): number | undefined => {
  const paragraph = paragraphs.find(p => start >= p.start && end <= p.end);
  return paragraph?.speaker;
};

export const assignSpeakersToWords = (response: DeepgramResponse): WordWithSpeaker[] => {
  const words = response.results.channels[0].alternatives[0].words;
  const paragraphs = response.results.channels[0].alternatives[0].paragraphs?.paragraphs || [];
  
  return words.map(word => ({
    ...word,
    speaker: findSpeakerForTimeRange(word.start, word.end, paragraphs)
  }));
};
