
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

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
    let processedChunks = 0;

    for (const chunkBuffer of chunks) {
      console.debug(`Processing chunk ${processedChunks + 1}/${chunks.length}`);
      
      const requestOptions = {
        ...options,
        diarize_version: options.diarize ? "3" : undefined
      };

      console.time(`chunk${processedChunks + 1}Processing`);
      
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          audio: Array.from(new Uint8Array(chunkBuffer)),
          mime_type: chunk.type,
          options: requestOptions,
          isPartialChunk: chunks.length > 1,
          chunkIndex: processedChunks,
          totalChunks: chunks.length
        }
      });

      console.timeEnd(`chunk${processedChunks + 1}Processing`);

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No response received from Supabase function');
      }

      if (!data.transcript) {
        console.error('No transcript in chunk response:', data);
        throw new Error('No transcript received from Deepgram');
      }

      allTranscripts += data.transcript + ' ';
      processedChunks++;

      console.debug('Chunk processed successfully:', {
        chunkNumber: processedChunks,
        transcriptLength: data.transcript.length,
        totalTranscriptLength: allTranscripts.length
      });
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
