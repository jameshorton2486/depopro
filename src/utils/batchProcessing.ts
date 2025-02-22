
import { toast } from "sonner";
import { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { processChunkWithRetry } from "./audioProcessing";

export interface BatchProcessingResult {
  transcript: string;
  metadata: {
    chunksProcessed: number;
    successfulChunks: number;
    failedChunks: number;
  };
}

export const processBatch = async (
  batch: ArrayBuffer[],
  mimeType: string,
  options: DeepgramOptions,
  startIndex: number,
  totalChunks: number
): Promise<TranscriptionResult[]> => {
  console.debug(`📦 Processing batch ${Math.floor(startIndex/batch.length) + 1}/${Math.ceil(totalChunks/batch.length)}:`, {
    batchSize: batch.length,
    startIndex
  });

  const batchPromises = batch.map((chunkBuffer, batchIndex) => 
    processChunkWithRetry(
      chunkBuffer,
      mimeType,
      options,
      startIndex + batchIndex,
      totalChunks
    )
  );

  return Promise.all(batchPromises);
};

export const processInBatches = async (
  chunks: ArrayBuffer[],
  mimeType: string,
  options: DeepgramOptions,
  onProgress?: (progress: number) => void,
  batchSize: number = 2
): Promise<BatchProcessingResult> => {
  let allTranscripts = '';
  let completedChunks = 0;
  let failedChunks = 0;

  console.debug(`🚀 Starting batch processing with concurrency of ${batchSize}`);

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const results = await processBatch(batch, mimeType, options, i, chunks.length);
    
    // Count failed chunks (empty transcripts)
    const batchFailures = results.filter(r => !r.transcript).length;
    failedChunks += batchFailures;
    
    // Only add non-empty transcripts
    allTranscripts += results
      .filter(r => r.transcript)
      .map(r => r.transcript)
      .join(' ');

    completedChunks += batch.length;

    if (onProgress) {
      onProgress(Math.round((completedChunks / chunks.length) * 100));
    }

    console.debug('📈 Processing progress:', {
      completedChunks,
      failedChunks,
      totalChunks: chunks.length,
      percent: Math.round((completedChunks / chunks.length) * 100),
      transcriptLength: allTranscripts.length
    });

    // Notify user of failed chunks
    if (batchFailures > 0) {
      toast.error(`Failed to process ${batchFailures} chunk(s) in current batch`);
    }
  }

  return {
    transcript: allTranscripts.trim(),
    metadata: {
      chunksProcessed: chunks.length,
      successfulChunks: chunks.length - failedChunks,
      failedChunks
    }
  };
};
