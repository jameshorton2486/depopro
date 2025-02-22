
import { AudioConverters } from './audio/converters';
import { WAVEncoder } from './audio/wavEncoder';
import { AudioCache } from './audio/audioCache';

export class AudioPreprocessor {
  private context: AudioContext;
  private static readonly TARGET_SAMPLE_RATE = 16000;

  constructor() {
    this.context = new AudioContext({ sampleRate: AudioPreprocessor.TARGET_SAMPLE_RATE });
  }

  async preprocessAudio(file: File): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
    console.debug('🎵 Starting audio preprocessing:', {
      originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type,
      name: file.name
    });

    try {
      if (file.size === 0) {
        throw new Error("The uploaded file appears to be empty.");
      }

      // Check cache first
      const cachedResult = await AudioCache.checkCache(file);
      if (cachedResult) {
        console.debug('✨ Found cached preprocessed audio');
        return { buffer: cachedResult, mimeType: 'audio/wav' };
      }

      const arrayBuffer = await file.arrayBuffer();
      console.debug('📊 Original audio details:', {
        size: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        type: file.type
      });

      // Process the audio
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      const monoBuffer = AudioConverters.convertToMono(audioBuffer);
      const resampledBuffer = await AudioConverters.resample(monoBuffer, this.context);
      const pcmBuffer = AudioConverters.convertToPCM16(resampledBuffer);
      const wavBuffer = WAVEncoder.createWAVFile(pcmBuffer);

      // Cache the result
      await AudioCache.cacheAudio(file, wavBuffer);

      console.debug('✅ Audio preprocessing complete');
      return { buffer: wavBuffer, mimeType: 'audio/wav' };
    } catch (error) {
      console.error('❌ Error preprocessing audio:', error);
      throw error;
    }
  }
}
