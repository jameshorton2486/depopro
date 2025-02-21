
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { 
  MAX_RETRIES, 
  TIMEOUT, 
  BASE_RETRY_DELAY,
  MAX_CHUNK_SIZE 
} from "./audioConstants";

interface ProcessAudioResponse {
  transcript: string;
  metadata?: {
    duration?: number;
    channels?: number;
    model?: string;
    processed_at?: string;
  };
}

const exponentialBackoff = async <T>(
  fn: () => Promise<T>, 
  retries: number = MAX_RETRIES,
  baseDelay: number = BASE_RETRY_DELAY
): Promise<T> => {
  let delay = baseDelay;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === retries) {
        console.error(`❌ All ${retries} attempts failed:`, {
          finalError: error,
          totalAttempts: attempt
        });
        throw error;
      }

      const jitter = Math.random() * 1000;
      delay = Math.min(delay * 2 + jitter, 15000); // Cap at 15 seconds

      console.warn(`⚠️ Attempt ${attempt} failed. Retrying in ${(delay/1000).toFixed(1)}s:`, {
        error: error.message,
        nextDelay: `${(delay/1000).toFixed(1)}s`,
        remainingAttempts: retries - attempt
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const processChunkWithRetry = async (
  chunkBuffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions,
  chunkIndex: number,
  totalChunks: number
): Promise<string> => {
  if (chunkBuffer.byteLength > MAX_CHUNK_SIZE) {
    console.error(`❌ Chunk ${chunkIndex + 1} exceeds maximum size:`, {
      size: chunkBuffer.byteLength,
      maxSize: MAX_CHUNK_SIZE
    });
    throw new Error(`Chunk size ${chunkBuffer.byteLength} exceeds maximum allowed size of ${MAX_CHUNK_SIZE}`);
  }

  const audioData = Array.from(new Uint8Array(chunkBuffer));
  
  if (audioData.length === 0) {
    console.error('❌ Empty audio chunk detected');
    throw new Error('Empty audio chunk');
  }

  console.debug(`🎯 Processing chunk ${chunkIndex + 1}/${totalChunks}:`, {
    chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
    mimeType,
    options
  });

  return await exponentialBackoff(async () => {
    const processingStartTime = Date.now();
    
    const { data, error } = await Promise.race([
      supabase.functions.invoke<ProcessAudioResponse>('process-audio', {
        body: {
          audio: audioData,
          mime_type: mimeType,
          options: {
            ...options,
            diarize_version: options.diarize ? "3" : undefined,
            chunk_info: {
              index: chunkIndex,
              total: totalChunks,
              size: chunkBuffer.byteLength
            }
          }
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${TIMEOUT}ms`)), TIMEOUT)
      )
    ]);

    const processingTime = Date.now() - processingStartTime;

    if (error) {
      const errorDetails = {
        status: error.status,
        message: error.message,
        details: error.details,
        context: error.context,
        processingTime
      };
      
      console.error(`❌ Function error for chunk ${chunkIndex + 1}:`, errorDetails);

      if (error.status === 413 || error.message?.includes('too large')) {
        throw new Error('Chunk size too large for processing');
      }
      
      throw error;
    }

    if (!data?.transcript || data.transcript.length < 5) {
      console.error('❌ Invalid transcript in response:', { data });
      throw new Error('Invalid transcript received');
    }

    console.debug(`✅ Chunk ${chunkIndex + 1} processed:`, {
      transcriptLength: data.transcript.length,
      processingTime: `${(processingTime / 1000).toFixed(2)}s`,
      metadata: data.metadata
    });

    return data.transcript;
  });
};
