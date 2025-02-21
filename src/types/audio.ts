
export interface AudioProcessingMetadata {
  duration?: number;
  channels?: number;
  model?: string;
  processed_at?: string;
  chunk_info?: {
    total: number;
    processed: number;
    failed: number;
  };
}

export interface AudioProcessingResponse {
  transcript: string;
  metadata?: AudioProcessingMetadata;
}

export interface AudioProcessingError {
  message: string;
  code?: string;
  details?: string;
}

export interface ChunkProcessingStats {
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  startTime: number;
  endTime?: number;
}

export type ProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';
