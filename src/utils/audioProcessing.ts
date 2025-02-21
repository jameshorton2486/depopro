
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { MAX_RETRIES, TIMEOUT } from "./audioConstants";

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

      console.debug(`📤 Sending chunk ${chunkIndex + 1} to process-audio:`, {
        dataLength: audioData.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const { data, error } = await Promise.race([
        supabase.functions.invoke<ProcessAudioResponse>('process-audio', {
          body: {
            audio: audioData,
            mime_type: mimeType,
            options: {
              ...options,
              diarize_version: options.diarize ? "3" : undefined
            }
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
        )
      ]);

      const processingTime = Date.now() - startTime;
      console.debug(`⏱️ Chunk ${chunkIndex + 1} processing completed:`, {
        ms: processingTime,
        seconds: (processingTime / 1000).toFixed(2)
      });

      if (error) {
        console.error(`❌ Function error (attempt ${attempts + 1}):`, {
          error,
          statusCode: error.status,
          message: error.message,
          details: error.details
        });
        throw error;
      }

      if (!data?.transcript) {
        console.error('❌ No transcript in response:', { data });
        throw new Error('No transcript received');
      }

      console.debug(`✅ Chunk ${chunkIndex + 1} processed:`, {
        transcriptLength: data.transcript.length,
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
        throw error;
      }

      const backoffTime = Math.min(1000 * Math.pow(2, attempts), 8000);
      const jitter = Math.random() * 1000;
      const waitTime = backoffTime + jitter;
      
      console.debug(`⏳ Retrying chunk ${chunkIndex + 1} in ${(waitTime / 1000).toFixed(2)}s...`);
      
      await delay(waitTime);
    }
  }

  throw lastError || new Error('Unexpected error in retry loop');
};
