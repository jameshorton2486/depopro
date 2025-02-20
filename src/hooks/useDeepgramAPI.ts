
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

const CHUNK_SIZE = 1 * 1024 * 1024; // Reduced to 1MB chunks for better handling
const TIMEOUT = 30000; // 30 second timeout per chunk
const MAX_RETRIES_PER_CHUNK = 3;

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
  let retries = 0;

  while (retries < MAX_RETRIES_PER_CHUNK) {
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT);

      console.debug(`Attempt ${retries + 1} for chunk ${chunkIndex + 1}/${totalChunks}`);

      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          audio: Array.from(new Uint8Array(chunkBuffer)),
          mime_type: mimeType,
          options: {
            ...options,
            diarize_version: options.diarize ? "3" : undefined
          },
          isPartialChunk: totalChunks > 1,
          chunkIndex,
          totalChunks
        },
        abortSignal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (error) {
        throw error;
      }

      if (!data?.transcript) {
        throw new Error('No transcript received from Deepgram');
      }

      return data.transcript;
    } catch (error) {
      retries++;
      console.warn(`Chunk ${chunkIndex + 1} failed, attempt ${retries}/${MAX_RETRIES_PER_CHUNK}:`, error);
      
      if (retries === MAX_RETRIES_PER_CHUNK) {
        throw new Error(`Failed to process chunk ${chunkIndex + 1} after ${MAX_RETRIES_PER_CHUNK} attempts`);
      }

      // Exponential backoff
      await delay(Math.min(1000 * Math.pow(2, retries), 8000));
    }
  }

  throw new Error('Unexpected error in retry loop');
};

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    if (!chunk || chunk.size === 0) {
      throw new Error('Invalid audio chunk');
    }

    console.debug('Starting audio processing:', {
      size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
      type: chunk.type,
      options: JSON.stringify(options, null, 2)
    });

    const arrayBuffer = await chunk.arrayBuffer();
    const chunks = sliceArrayBuffer(arrayBuffer, CHUNK_SIZE);
    
    console.debug('Split audio into chunks:', {
      numberOfChunks: chunks.length,
      chunkSize: `${(CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB`,
      totalSize: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`
    });

    let allTranscripts = '';
    
    // Process chunks with some parallelization but not all at once
    const batchSize = 3; // Process 3 chunks at a time
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

      const batchResults = await Promise.all(batchPromises);
      allTranscripts += batchResults.join(' ');

      console.debug(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }

    const finalTranscript = allTranscripts.trim();
    
    console.debug('All chunks processed successfully:', {
      totalChunks: chunks.length,
      finalTranscriptLength: finalTranscript.length,
      wordCount: finalTranscript.split(' ').length
    });

    return {
      transcript: finalTranscript,
      metadata: { chunksProcessed: chunks.length },
      storedFileName: `processed_${Date.now()}.txt`
    };
  } catch (error) {
    console.error("Error processing chunks:", error);
    throw error;
  }
};
