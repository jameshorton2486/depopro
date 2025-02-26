
import type { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import type { ExtendedMetadata } from "@/services/transcription/types";

export interface TranscriptionError extends Error {
  code?: string;
  details?: unknown;
}

export interface StoredTranscription {
  id: string;
  file_path: string;
  file_name: string;
  metadata: ExtendedMetadata;
  created_at: string;
  raw_response: DeepgramResponse;
}

export interface TranscriptionState {
  uploadedFile: File | null;
  transcriptionResult: TranscriptionResult | null;
  isProcessing: boolean;
  processingStatus: string;
  progress: number;
  options: DeepgramOptions;
}

export interface TranscriptionHookReturn {
  uploadedFile: File | null;
  transcript: string;
  transcriptionResult: TranscriptionResult | null;
  isProcessing: boolean;
  processingStatus: string;
  progress: number;
  options: DeepgramOptions;
  model: string;
  onDrop: (files: File[]) => Promise<void>;
  handleOptionsChange: (newOptions: Partial<DeepgramOptions>) => void;
  onModelChange: (model: string) => void;
  handleTranscribe: () => Promise<void>;
  handleDownload: (transcript: string) => void;
}
