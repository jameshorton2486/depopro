import type { DeepgramOptions, TranscriptionResult, DeepgramResponse } from "@/types/deepgram";
import { supabase } from "@/integrations/supabase/client";
import { AudioPreprocessor } from "./audioPreprocessing";
import { 
  MAX_RETRIES, 
  BASE_RETRY_DELAY,
  MAX_CHUNK_SIZE,
  DEBUG,
  SUPPORTED_AUDIO_TYPES,
  ERROR_MESSAGES
} from "./audioConstants";

const audioPreprocessor = new AudioPreprocessor();

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
): Promise<TranscriptionResult> => {
  try {
    console.debug(`🔄 Processing chunk ${chunkIndex + 1}/${totalChunks}`, {
      chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
      mimeType,
      options: JSON.stringify(options)
    });

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

    if (chunkBuffer.byteLength === 0) {
      console.error('❌ Empty audio data');
      throw new Error(ERROR_MESSAGES.EMPTY_FILE);
    }

    const tempFile = new File([chunkBuffer], 'chunk.wav', { type: mimeType });
    const { buffer: processedBuffer, mimeType: processedMimeType } = await audioPreprocessor.preprocessAudio(tempFile);

    return await exponentialBackoff(async () => {
      const processingStartTime = Date.now();
      console.debug('📦 Preparing form data for chunk', chunkIndex + 1);
      
      const formData = new FormData();
      const audioBlob = new Blob([processedBuffer], { type: processedMimeType });
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

      const response = data as DeepgramResponse;
      if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
        console.error('❌ Invalid response from transcribe function:', data);
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      const alternative = response.results.channels[0].alternatives[0];
      const processingTime = Date.now() - processingStartTime;

      console.debug(`✅ Chunk ${chunkIndex + 1}/${totalChunks} processed`, {
        transcriptLength: alternative.transcript.length,
        processingTime: `${processingTime / 1000}s`,
        hasParagraphs: !!alternative.paragraphs
      });

      return {
        transcript: alternative.transcript,
        paragraphs: alternative.paragraphs?.paragraphs,
        metadata: {
          processingTime,
          audioLength: alternative.words?.[alternative.words.length - 1]?.end || 0,
          speakers: new Set(alternative.words?.map(w => w.speaker).filter(Boolean)).size
        }
      };
    });
  } catch (error) {
    console.error(`❌ Error processing chunk ${chunkIndex + 1}/${totalChunks}:`, error);
    throw error;
  }
};
