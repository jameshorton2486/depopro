
import type { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
import { supabase } from "@/integrations/supabase/client";
import { 
  MAX_RETRIES, 
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
      console.error(`❌ Attempt ${attempt} failed:`, {
        error: error.message,
        stack: error.stack,
        type: error.name
      });
      
      if (attempt === retries) {
        console.error(`❌ All ${retries} attempts failed:`, error);
        throw error;
      }

      const jitter = Math.random() * 1000;
      delay = Math.min(delay * 2 + jitter, 15000);
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
  try {
    console.debug(`🔄 Processing chunk ${chunkIndex + 1}/${totalChunks}`, {
      chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
      mimeType,
      options: JSON.stringify(options)
    });

    // File validation
    if (!SUPPORTED_AUDIO_TYPES.includes(mimeType as any)) {
      console.error('❌ Unsupported audio format:', {
        providedType: mimeType,
        supportedTypes: SUPPORTED_AUDIO_TYPES
      });
      throw new Error(ERROR_MESSAGES.UNSUPPORTED_TYPE);
    }

    if (chunkBuffer.byteLength > MAX_CHUNK_SIZE) {
      console.error('❌ Buffer exceeds maximum size:', {
        size: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        maxSize: `${(MAX_CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB`
      });
      throw new Error(ERROR_MESSAGES.CHUNK_TOO_LARGE);
    }

    const audioData = new Uint8Array(chunkBuffer);
    
    if (audioData.length === 0) {
      console.error('❌ Empty audio data');
      throw new Error(ERROR_MESSAGES.EMPTY_FILE);
    }

    return await exponentialBackoff(async () => {
      const processingStartTime = Date.now();
      console.debug('📦 Preparing form data for chunk', chunkIndex + 1);
      
      const formData = new FormData();
      const audioBlob = new Blob([audioData], { type: mimeType });
      formData.append('audio', audioBlob);
      formData.append('options', JSON.stringify({
        ...options,
        chunk_info: {
          index: chunkIndex,
          total: totalChunks
        }
      }));

      console.debug('🚀 Invoking transcribe function for chunk', chunkIndex + 1);
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: formData
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      if (!data?.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        console.error('❌ Invalid response from transcribe function:', data);
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      const transcript = data.results.channels[0].alternatives[0].transcript;
      console.debug(`✅ Chunk ${chunkIndex + 1}/${totalChunks} processed`, {
        transcriptLength: transcript.length,
        processingTime: `${(Date.now() - processingStartTime) / 1000}s`
      });

      return transcript;
    });
  } catch (error) {
    console.error(`❌ Error processing chunk ${chunkIndex + 1}/${totalChunks}:`, error);
    throw error;
  }
};
