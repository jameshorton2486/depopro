
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
const TIMEOUT = 30000; // 30 second timeout
const MAX_RETRIES = 3;

interface ProcessAudioResponse {
  transcript: string;
  metadata?: {
    duration?: number;
    channels?: number;
    model?: string;
    processed_at?: string;
  };
}

const validateAudioFile = (file: Blob) => {
  const supportedTypes = [
    'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ];

  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Supported types: ${supportedTypes.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }

  if (file.size === 0) {
    throw new Error('File is empty');
  }
};

const sliceArrayBuffer = (buffer: ArrayBuffer, chunkSize: number): ArrayBuffer[] => {
  const chunks: ArrayBuffer[] = [];
  let offset = 0;
  
  while (offset < buffer.byteLength) {
    const chunk = buffer.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  
  return chunks;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processChunkWithRetry = async (
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
      console.debug(`Processing chunk ${chunkIndex + 1}/${totalChunks}, attempt ${attempts + 1}/${MAX_RETRIES}`);

      const audioData = Array.from(new Uint8Array(chunkBuffer));
      
      if (audioData.length === 0) {
        throw new Error('Empty audio chunk');
      }

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
      console.debug(`Chunk ${chunkIndex + 1} processed in ${processingTime}ms`);

      if (error) {
        console.error(`Function error (attempt ${attempts + 1}):`, error);
        throw error;
      }

      if (!data?.transcript) {
        throw new Error('No transcript received');
      }

      return data.transcript;

    } catch (error) {
      lastError = error;
      attempts++;
      console.warn(`Chunk ${chunkIndex + 1} failed (attempt ${attempts}):`, error);
      
      if (attempts === MAX_RETRIES) {
        console.error(`All ${MAX_RETRIES} attempts failed for chunk ${chunkIndex + 1}`, lastError);
        throw new Error(`Failed to process chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }

      // Exponential backoff with jitter
      const backoffTime = Math.min(1000 * Math.pow(2, attempts), 8000);
      const jitter = Math.random() * 1000;
      await delay(backoffTime + jitter);
    }
  }

  throw lastError || new Error('Unexpected error in retry loop');
};

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    // Validate input file
    validateAudioFile(chunk);

    console.debug('Processing audio:', {
      size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
      type: chunk.type,
      options: JSON.stringify(options, null, 2)
    });

    const arrayBuffer = await chunk.arrayBuffer();
    const chunks = sliceArrayBuffer(arrayBuffer, CHUNK_SIZE);
    
    console.debug('Split into chunks:', {
      count: chunks.length,
      chunkSize: `${(CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB`
    });

    let allTranscripts = '';
    let completedChunks = 0;
    
    // Process chunks with controlled concurrency
    const batchSize = 3;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchPromises = batch.map((chunkBuffer, batchIndex) => 
        processChunkWithRetry(
          chunkBuffer,
          chunk.type,
          options,
          i + batchIndex,
          chunks.length
        )
      );

      const results = await Promise.all(batchPromises);
      allTranscripts += results.join(' ');
      completedChunks += batch.length;

      console.debug('Processing progress:', {
        completedChunks,
        totalChunks: chunks.length,
        percent: Math.round((completedChunks / chunks.length) * 100)
      });
    }

    return {
      transcript: allTranscripts.trim(),
      metadata: { chunksProcessed: chunks.length }
    };
  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
};
