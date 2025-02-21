
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { MAX_RETRIES, TIMEOUT, MAX_CHUNK_SIZE } from "./audioConstants";

interface ProcessAudioResponse {
  transcript: string;
  metadata?: {
    duration?: number;
    channels?: number;
    model?: string;
    processed_at?: string;
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const processChunkWithRetry = async (
  chunkBuffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions,
  chunkIndex: number,
  totalChunks: number
): Promise<string> => {
  let attempts = 0;
  let lastError: Error | null = null;

  // Check if chunk is too large
  if (chunkBuffer.byteLength > MAX_CHUNK_SIZE) {
    console.error(`❌ Chunk ${chunkIndex + 1} exceeds maximum size:`, {
      size: chunkBuffer.byteLength,
      maxSize: MAX_CHUNK_SIZE
    });
    throw new Error(`Chunk size ${chunkBuffer.byteLength} exceeds maximum allowed size of ${MAX_CHUNK_SIZE}`);
  }

  while (attempts < MAX_RETRIES) {
    try {
      console.debug(`🎯 Processing chunk ${chunkIndex + 1}/${totalChunks}:`, {
        attempt: attempts + 1,
        maxRetries: MAX_RETRIES,
        chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        mimeType,
        options
      });

      const audioData = Array.from(new Uint8Array(chunkBuffer));
      
      if (audioData.length === 0) {
        console.error('❌ Empty audio chunk detected');
        throw new Error('Empty audio chunk');
      }

      // Add more context to the Edge Function call
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
        
        console.error(`❌ Function error (attempt ${attempts + 1}):`, errorDetails);

        // Check for specific error types
        if (error.status === 413 || error.message?.includes('too large')) {
          throw new Error('Chunk size too large for processing');
        }
        
        if (error.status === 429) {
          // Rate limit hit - wait longer
          await delay(10000); // Wait 10 seconds before retry
          throw error;
        }

        throw error;
      }

      if (!data?.transcript) {
        console.error('❌ No transcript in response:', { data });
        throw new Error('No transcript received');
      }

      console.debug(`✅ Chunk ${chunkIndex + 1} processed:`, {
        transcriptLength: data.transcript.length,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`,
        metadata: data.metadata
      });

      return data.transcript;

    } catch (error) {
      lastError = error;
      attempts++;
      
      console.warn(`⚠️ Chunk ${chunkIndex + 1} failed:`, {
        attempt: attempts,
        error: error.message,
        stack: error.stack,
        status: error.status
      });
      
      if (attempts === MAX_RETRIES) {
        console.error(`❌ All ${MAX_RETRIES} attempts failed for chunk ${chunkIndex + 1}:`, {
          error: lastError,
          finalAttempt: attempts
        });
        
        // If the error is related to chunk size, return empty string to skip this chunk
        if (error.message?.includes('too large')) {
          console.warn(`⚠️ Skipping oversized chunk ${chunkIndex + 1}`);
          return '';
        }
        
        return '';
      }

      // Exponential backoff with jitter and longer initial wait
      const baseDelay = 2000; // Start with 2 seconds
      const backoffTime = Math.min(baseDelay * Math.pow(2, attempts), 15000); // Cap at 15 seconds
      const jitter = Math.random() * 2000; // Up to 2 seconds of jitter
      const waitTime = backoffTime + jitter;
      
      console.debug(`⏳ Retrying chunk ${chunkIndex + 1} in ${(waitTime / 1000).toFixed(2)}s...`);
      
      await delay(waitTime);
    }
  }

  return '';
};
