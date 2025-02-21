
import type { DeepgramOptions } from "@/types/deepgram";
import { supabase } from "@/integrations/supabase/client";
import { 
  MAX_RETRIES, 
  TIMEOUT, 
  BASE_RETRY_DELAY,
  MAX_CHUNK_SIZE,
  DEBUG,
  SUPPORTED_AUDIO_TYPES,
  ERROR_MESSAGES
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
    } catch (error: any) {
      lastError = error;
      
      if (attempt === retries) {
        console.error(`❌ All ${retries} attempts failed:`, error);
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
  // File validation
  if (!SUPPORTED_AUDIO_TYPES.includes(mimeType as any)) {
    console.error('❌ Unsupported audio format:', {
      providedType: mimeType,
      supportedTypes: SUPPORTED_AUDIO_TYPES
    });
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_TYPE);
  }

  if (chunkBuffer.byteLength > MAX_CHUNK_SIZE) {
    console.error(`❌ Chunk ${chunkIndex + 1} exceeds maximum size`);
    throw new Error(ERROR_MESSAGES.CHUNK_TOO_LARGE);
  }

  const audioData = new Uint8Array(chunkBuffer);
  
  if (audioData.length === 0) {
    throw new Error(ERROR_MESSAGES.EMPTY_FILE);
  }

  return await exponentialBackoff(async () => {
    const processingStartTime = Date.now();
    
    // Create form data for the request
    const formData = new FormData();
    const audioBlob = new Blob([audioData], { type: mimeType });
    formData.append('audio', audioBlob);
    formData.append('options', JSON.stringify(options));

    try {
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData
      });

      if (error) {
        throw error;
      }

      const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

      if (!transcript) {
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      const processingTime = Date.now() - processingStartTime;
      console.debug(`✅ Chunk ${chunkIndex + 1} processed successfully:`, {
        transcriptLength: transcript.length,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`
      });

      return transcript;
    } catch (error: any) {
      console.error('❌ Processing error:', error);
      throw new Error(error.message || ERROR_MESSAGES.PROCESSING_ERROR);
    }
  });
};
