
import { toast } from "sonner";
import { DeepgramOptions } from "@/types/deepgram";
import { validateAudioFile } from "@/utils/audioValidation";
import { sliceArrayBuffer } from "@/utils/audioChunking";
import { processInBatches } from "@/utils/batchProcessing";
import { testAPIs } from "@/utils/apiTesting";
export { type APITestResults, type APITestStatus, type APITestResult } from "@/utils/apiTesting";

export const processAudioInChunks = async (
  file: Blob,
  options: DeepgramOptions,
  onProgress?: (progress: number) => void
) => {
  try {
    console.debug('🎬 Starting chunked audio processing:', {
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type
    });

    validateAudioFile(file);

    console.debug('🔄 Converting blob to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.debug('✅ Array buffer created:', {
      size: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`
    });

    const chunks = sliceArrayBuffer(arrayBuffer);
    
    console.debug('📊 Processing configuration:', {
      totalChunks: chunks.length,
      totalSize: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`
    });

    const result = await processInBatches(chunks, file.type, options, onProgress);

    console.debug('🎉 Processing completed:', {
      finalTranscriptLength: result.transcript.length,
      ...result.metadata
    });

    if (result.metadata.failedChunks > 0) {
      toast.warning(`Completed with ${result.metadata.failedChunks} failed chunk(s). Some audio content may be missing.`);
    } else {
      toast.success('Audio processing completed successfully!');
    }

    return result;
  } catch (error) {
    console.error('❌ Error processing audio:', {
      error: error.message,
      stack: error.stack,
      type: error.name
    });
    throw error;
  }
};

export { testAPIs };
