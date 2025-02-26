
import { toast } from "sonner";
import { DeepgramOptions } from "@/types/deepgram";
import { AudioProcessingService } from "@/services/audio/AudioProcessingService";
import { testAPIs } from "@/utils/apiTesting";
export { type APITestResults, type APITestStatus, type APITestResult } from "@/utils/apiTesting";

export const processAudioInChunks = async (
  file: Blob,
  options: DeepgramOptions,
  onProgress?: (progress: number) => void
) => {
  try {
    console.debug('🎬 Starting audio processing:', {
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type
    });

    AudioProcessingService.validateAudioFile(file as File);
    const result = await AudioProcessingService.processAudio(file as File, options, onProgress);

    console.debug('🎉 Processing completed:', {
      finalTranscriptLength: result.results.channels[0].alternatives[0].transcript.length,
    });

    toast.success('Audio processing completed successfully!');
    return result;
  } catch (error: any) {
    console.error('❌ Error processing audio:', {
      error: error.message,
      stack: error.stack,
      type: error.name
    });
    throw error;
  }
};

export { testAPIs };
