import { DeepgramResponse, DeepgramParagraph } from "@/types/deepgram";

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

export const processAudioChunk = (chunk: ArrayBuffer): Promise<ArrayBuffer> => {
  return Promise.resolve(chunk);
};

export const extractMetadata = (audio: ArrayBuffer): AudioChunkMetadata => {
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
