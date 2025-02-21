
import { supabase } from "@/integrations/supabase/client";
import type { DeepgramOptions } from "@/types/deepgram";
import type { AudioProcessingResponse, AudioProcessingError } from "@/types/audio";
import { 
  MAX_RETRIES, 
  TIMEOUT, 
  BASE_RETRY_DELAY,
  MAX_CHUNK_SIZE,
  CHUNK_SIZE,
  DEBUG 
} from "./audioConstants";

const exponentialBackoff = async <T>(
  fn: () => Promise<T>, 
  retries: number = MAX_RETRIES,
  baseDelay: number = BASE_RETRY_DELAY
): Promise<T> => {
  let delay = baseDelay;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (DEBUG) console.debug(`🔄 Attempt ${attempt}/${retries} starting...`);
      const result = await fn();
      if (DEBUG) console.debug(`✅ Attempt ${attempt} succeeded`);
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt === retries) {
        console.error(`❌ All ${retries} attempts failed:`, {
          finalError: error,
          totalAttempts: attempt,
          errorDetails: {
            message: error.message,
            stack: error.stack,
            cause: error.cause
          }
        });
        throw error;
      }

      const jitter = Math.random() * 1000;
      delay = Math.min(delay * 2 + jitter, 15000);

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
  if (DEBUG) {
    console.debug(`🎯 Starting chunk processing:`, {
      chunkIndex: chunkIndex + 1,
      totalChunks,
      chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
      maxChunkSize: `${(MAX_CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB`,
      timestamp: new Date().toISOString()
    });
  }

  if (chunkBuffer.byteLength > MAX_CHUNK_SIZE) {
    console.error(`❌ Chunk ${chunkIndex + 1} exceeds maximum size:`, {
      size: chunkBuffer.byteLength,
      maxSize: MAX_CHUNK_SIZE,
      difference: `${((chunkBuffer.byteLength - MAX_CHUNK_SIZE) / (1024 * 1024)).toFixed(2)}MB over limit`
    });
    throw new Error(`Chunk size ${chunkBuffer.byteLength} exceeds maximum allowed size of ${MAX_CHUNK_SIZE}`);
  }

  const audioData = Array.from(new Uint8Array(chunkBuffer));
  
  if (audioData.length === 0) {
    console.error('❌ Empty audio chunk detected', {
      chunkIndex: chunkIndex + 1,
      totalChunks,
      timestamp: new Date().toISOString()
    });
    throw new Error('Empty audio chunk');
  }

  if (DEBUG) {
    console.debug(`📊 Processing chunk ${chunkIndex + 1}/${totalChunks}:`, {
      chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
      mimeType,
      options: JSON.stringify(options, null, 2),
      timestamp: new Date().toISOString()
    });
  }

  return await exponentialBackoff(async () => {
    const processingStartTime = Date.now();
    
    const { data, error } = await Promise.race([
      supabase.functions.invoke<AudioProcessingResponse>('process-audio', {
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
        setTimeout(() => {
          console.error(`⏱️ Timeout reached after ${TIMEOUT}ms for chunk ${chunkIndex + 1}`);
          reject(new Error(`Timeout after ${TIMEOUT}ms`));
        }, TIMEOUT)
      )
    ]);

    const processingTime = Date.now() - processingStartTime;

    if (error) {
      const errorDetails = {
        status: error.status,
        message: error.message,
        details: error.details,
        context: error.context,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString()
      };
      
      console.error(`❌ Function error for chunk ${chunkIndex + 1}:`, errorDetails);

      if (error.status === 413 || error.message?.includes('too large')) {
        throw new Error('Chunk size too large for processing');
      }
      
      throw error;
    }

    if (!data?.transcript || data.transcript.length < 5) {
      console.error('❌ Invalid transcript in response:', { 
        data,
        chunkIndex: chunkIndex + 1,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid transcript received');
    }

    if (DEBUG) {
      console.debug(`✅ Chunk ${chunkIndex + 1} processed successfully:`, {
        transcriptLength: data.transcript.length,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`,
        metadata: data.metadata,
        timestamp: new Date().toISOString()
      });
    }

    return data.transcript;
  });
};
