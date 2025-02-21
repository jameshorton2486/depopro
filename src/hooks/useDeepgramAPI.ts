
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
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

  while (attempts < MAX_RETRIES) {
    try {
      console.debug(`Processing chunk ${chunkIndex + 1}/${totalChunks}, attempt ${attempts + 1}`);

      const audioData = Array.from(new Uint8Array(chunkBuffer));
      
      if (audioData.length === 0) {
        throw new Error('Empty audio chunk');
      }

      const { data, error } = await supabase.functions.invoke<ProcessAudioResponse>(
        'process-audio',
        {
          body: {
            audio: audioData,
            mime_type: mimeType,
            options: {
              ...options,
              diarize_version: options.diarize ? "3" : undefined
            }
          }
        }
      );

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (!data?.transcript) {
        throw new Error('No transcript received');
      }

      return data.transcript;

    } catch (error) {
      attempts++;
      console.warn(`Chunk ${chunkIndex + 1} failed:`, error);
      
      if (attempts === MAX_RETRIES) {
        throw new Error(`Failed to process chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts`);
      }

      // Exponential backoff
      await delay(Math.min(1000 * Math.pow(2, attempts), 8000));
    }
  }

  throw new Error('Unexpected error in retry loop');
};

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    if (!chunk || chunk.size === 0) {
      throw new Error('Invalid audio chunk');
    }

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

      console.debug(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }

    return {
      transcript: allTranscripts.trim(),
      metadata: { chunksProcessed: chunks.length }
    };
  } catch (error) {
    console.error("Error processing chunks:", error);
    throw error;
  }
};
