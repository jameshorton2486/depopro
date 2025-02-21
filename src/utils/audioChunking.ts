
import { CHUNK_SIZE } from './audioConstants';

export const sliceArrayBuffer = (buffer: ArrayBuffer, chunkSize: number = CHUNK_SIZE): ArrayBuffer[] => {
  try {
    const fileSize = buffer.byteLength;
    console.debug('📦 Starting buffer slicing:', {
      totalSize: `${(fileSize / (1024 * 1024)).toFixed(2)}MB`,
      chunkSize: `${(chunkSize / (1024 * 1024)).toFixed(2)}MB`,
      estimatedChunks: Math.ceil(fileSize / chunkSize)
    });

    const chunks: ArrayBuffer[] = [];
    let offset = 0;
  
    while (offset < buffer.byteLength) {
      try {
        const currentChunkSize = Math.min(chunkSize, buffer.byteLength - offset);
        const chunk = buffer.slice(offset, offset + currentChunkSize);
        
        if (chunk.byteLength === 0) {
          console.error('❌ Created empty chunk at offset:', offset);
          break;
        }

        chunks.push(chunk);
        console.debug(`✓ Chunk ${chunks.length} created:`, {
          offset: `${(offset / (1024 * 1024)).toFixed(2)}MB`,
          size: `${(chunk.byteLength / (1024 * 1024)).toFixed(2)}MB`,
          remaining: `${((buffer.byteLength - (offset + currentChunkSize)) / (1024 * 1024)).toFixed(2)}MB`
        });

        offset += currentChunkSize;
      } catch (chunkError) {
        console.error(`❌ Error creating chunk at offset ${offset}:`, {
          error: chunkError.message,
          stack: chunkError.stack,
          offset: `${(offset / (1024 * 1024)).toFixed(2)}MB`,
          remaining: `${((buffer.byteLength - offset) / (1024 * 1024)).toFixed(2)}MB`
        });
        offset += chunkSize; // Move to next chunk even if this one failed
      }
    }
    
    if (chunks.length === 0) {
      throw new Error('No valid chunks could be created from the buffer');
    }
    
    console.debug(`✅ Buffer slicing complete:`, {
      totalChunks: chunks.length,
      averageChunkSize: `${(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0) / chunks.length / (1024 * 1024)).toFixed(2)}MB`,
      smallestChunk: `${(Math.min(...chunks.map(c => c.byteLength)) / (1024 * 1024)).toFixed(2)}MB`,
      largestChunk: `${(Math.max(...chunks.map(c => c.byteLength)) / (1024 * 1024)).toFixed(2)}MB`
    });
    
    return chunks;
  } catch (error) {
    console.error('❌ Error during buffer slicing:', {
      error: error.message,
      stack: error.stack,
      bufferSize: `${(buffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
      chunkSize: `${(chunkSize / (1024 * 1024)).toFixed(2)}MB`
    });
    throw error;
  }
};
