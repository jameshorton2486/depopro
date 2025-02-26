
import { toast } from "sonner";
import { processAudioChunk, processChunkWithRetry } from "./audioProcessing";

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export const processBatch = async (
  audioData: ArrayBuffer,
  onProgress?: (progress: number) => void
): Promise<ArrayBuffer[]> => {
  const chunks: ArrayBuffer[] = [];
  const totalChunks = Math.ceil(audioData.byteLength / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, audioData.byteLength);
    const chunk = audioData.slice(start, end);
    
    try {
      const processedChunk = await processChunkWithRetry(chunk);
      chunks.push(processedChunk);
      
      if (onProgress) {
        onProgress((i + 1) / totalChunks * 100);
      }
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}/${totalChunks}:`, error);
      toast.error(`Failed to process audio chunk ${i + 1}`);
      throw error;
    }
  }
  
  return chunks;
};

export const mergeBatchResults = (chunks: ArrayBuffer[]): ArrayBuffer => {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new ArrayBuffer(totalLength);
  const view = new Uint8Array(result);
  
  let offset = 0;
  for (const chunk of chunks) {
    view.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  
  return result;
};
