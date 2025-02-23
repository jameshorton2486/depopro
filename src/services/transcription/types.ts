
import { DeepgramResponse, TranscriptionResult } from "@/types/deepgram";

export interface SentimentResult {
  overallSentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface SpeakerCharacteristics {
  speakingRate: number;
  pitchRange: [number, number];
}

export interface ExtendedMetadata {
  sentimentAnalysis?: SentimentResult;
  topicDetection?: string[];
  speakerCharacteristics?: SpeakerCharacteristics;
}

export interface TranscriptFormatter {
  format(data: DeepgramResponse): TranscriptionResult;
  formatMetadata?(data: DeepgramResponse): ExtendedMetadata;
}
