
import type { DeepgramOptions, TranscriptionResult } from "@/types/deepgram";
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

      console.warn(`⚠️ Retrying in ${(delay/1000).toFixed(1)}s:`, {
        error: error.message,
        nextDelay: `${(delay/1000).toFixed(1)}s`,
        remainingAttempts: retries - attempt
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const processAudioChunk = async (
  buffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions
): Promise<TranscriptionResult> => {
  console.debug('🎬 Starting audio chunk processing:', {
    bufferSize: `${(buffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
    mimeType,
    options: JSON.stringify(options, null, 2)
  });

  // File validation
  if (!SUPPORTED_AUDIO_TYPES.includes(mimeType as any)) {
    console.error('❌ Unsupported audio format:', {
      providedType: mimeType,
      supportedTypes: SUPPORTED_AUDIO_TYPES
    });
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_TYPE);
  }

  if (buffer.byteLength > MAX_CHUNK_SIZE) {
    console.error('❌ Buffer exceeds maximum size:', {
      size: `${(buffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
      maxSize: `${(MAX_CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB`
    });
    throw new Error(ERROR_MESSAGES.CHUNK_TOO_LARGE);
  }

  const audioData = new Uint8Array(buffer);
  
  if (audioData.length === 0) {
    console.error('❌ Empty audio data');
    throw new Error(ERROR_MESSAGES.EMPTY_FILE);
  }

  return await exponentialBackoff(async () => {
    const processingStartTime = Date.now();
    console.debug('📦 Preparing form data');
    
    const formData = new FormData();
    const audioBlob = new Blob([audioData], { type: mimeType });
    formData.append('audio', audioBlob);
    formData.append('options', JSON.stringify(options));

    console.debug('🚀 Invoking transcribe function');
    const { data, error } = await supabase.functions.invoke('transcribe', {
      body: formData
    });

    if (error) {
      console.error('❌ Supabase function error:', {
        error: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!data) {
      console.error('❌ No data received from transcribe function');
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
    }

    console.debug('📊 Processing response:', {
      success: !!data,
      hasResults: !!data.results,
      hasTranscript: !!data.results?.channels?.[0]?.alternatives?.[0]?.transcript
    });

    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript) {
      console.error('❌ No transcript in response:', data);
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
    }

    const processingTime = Date.now() - processingStartTime;
    console.debug('✅ Processing complete:', {
      transcriptLength: transcript.length,
      processingTime: `${(processingTime / 1000).toFixed(2)}s`
    });

    return { transcript };
  });
};
