
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";

export interface StoredTranscription {
  id: string;
  file_path: string;
  file_name: string;
  metadata: any;
  created_at: string;
  raw_response: any;
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
