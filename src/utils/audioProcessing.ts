
import type { DeepgramOptions } from "@/types/deepgram";
import type { AudioProcessingResponse, AudioProcessingError } from "@/types/audio";
import { 
  MAX_RETRIES, 
  TIMEOUT, 
  BASE_RETRY_DELAY,
  MAX_CHUNK_SIZE,
  CHUNK_SIZE,
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
    } catch (error) {
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
  // Validate audio format
  if (!SUPPORTED_AUDIO_TYPES.includes(mimeType as any)) {
    console.error('❌ Unsupported audio format:', {
      providedType: mimeType,
      supportedTypes: SUPPORTED_AUDIO_TYPES
    });
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_TYPE);
  }

  console.debug('📍 Audio format validation:', {
    mimeType,
    isSupported: true,
    timestamp: new Date().toISOString()
  });

  // Validate chunk size
  if (chunkBuffer.byteLength > MAX_CHUNK_SIZE) {
    console.error(`❌ Chunk ${chunkIndex + 1} exceeds maximum size:`, {
      size: chunkBuffer.byteLength,
      maxSize: MAX_CHUNK_SIZE,
      difference: `${((chunkBuffer.byteLength - MAX_CHUNK_SIZE) / 1024).toFixed(2)}KB over limit`
    });
    throw new Error(ERROR_MESSAGES.CHUNK_TOO_LARGE);
  }

  // Convert ArrayBuffer to Uint8Array (raw bytes) for processing
  const audioData = new Uint8Array(chunkBuffer);
  
  if (audioData.length === 0) {
    console.error('❌ Empty audio chunk detected', {
      chunkIndex: chunkIndex + 1,
      totalChunks,
      timestamp: new Date().toISOString()
    });
    throw new Error(ERROR_MESSAGES.EMPTY_FILE);
  }

  console.debug(`📊 Processing chunk ${chunkIndex + 1}/${totalChunks}:`, {
    chunkSize: `${(chunkBuffer.byteLength / 1024).toFixed(2)}KB`,
    mimeType,
    options: JSON.stringify(options, null, 2),
    timestamp: new Date().toISOString()
  });

  return await exponentialBackoff(async () => {
    const processingStartTime = Date.now();
    
    console.debug("🛠️ Sending request to Deepgram with payload:", {
      mimeType,
      chunkSize: `${(chunkBuffer.byteLength / 1024).toFixed(2)}KB`,
      options: options,
      chunkIndex: chunkIndex + 1,
      totalChunks
    });

    // Create form data for the request
    const formData = new FormData();
    const audioBlob = new Blob([audioData], { type: mimeType });
    formData.append('audio', audioBlob);

    // Get API key from localStorage
    const apiKey = localStorage.getItem('DEEPGRAM_API_KEY');
    if (!apiKey) {
      throw new Error('Deepgram API key not found. Please set your API key first.');
    }

    const response = await Promise.race([
      fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
        body: formData
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => {
          console.error(`⏱️ Timeout reached after ${TIMEOUT}ms for chunk ${chunkIndex + 1}`);
          reject(new Error(ERROR_MESSAGES.TIMEOUT_ERROR));
        }, TIMEOUT)
      )
    ]);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process audio');
    }

    const data = await response.json();
    const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    const processingTime = Date.now() - processingStartTime;

    if (!transcript || transcript.length < 5) {
      console.error('❌ Invalid transcript in response:', { 
        data,
        chunkIndex: chunkIndex + 1,
        processingTime: `${(processingTime / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString()
      });
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
    }

    console.debug(`✅ Chunk ${chunkIndex + 1} processed successfully:`, {
      transcriptLength: transcript.length,
      processingTime: `${(processingTime / 1000).toFixed(2)}s`,
      metadata: data.metadata,
      timestamp: new Date().toISOString()
    });

    return transcript;
  });
};
