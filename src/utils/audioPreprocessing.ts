
export class AudioPreprocessor {
  private context: AudioContext;
  private static readonly TARGET_SAMPLE_RATE = 8000;
  private static readonly CACHE_PREFIX = 'transcript_';
  private static readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.context = new AudioContext();
  }

  async preprocessAudio(file: File): Promise<ArrayBuffer> {
    console.debug('🎵 Starting audio preprocessing:', {
      originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type
    });

    try {
      // Check cache first
      const cachedResult = await this.checkCache(file);
      if (cachedResult) {
        console.debug('✨ Found cached preprocessed audio');
        return cachedResult;
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      // Downsample
      const downsampledBuffer = await this.downsample(audioBuffer);
      
      // Normalize
      const normalizedBuffer = this.normalize(downsampledBuffer);
      
      // Cache the result
      await this.cacheAudio(file, normalizedBuffer);

      console.debug('✅ Audio preprocessing complete:', {
        originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        processedSize: `${(normalizedBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        reductionPercentage: `${((1 - normalizedBuffer.byteLength / file.size) * 100).toFixed(1)}%`
      });

      return normalizedBuffer;
    } catch (error) {
      console.error('❌ Error preprocessing audio:', error);
      throw error;
    }
  }

  private async downsample(audioBuffer: AudioBuffer): Promise<ArrayBuffer> {
    const offlineContext = new OfflineAudioContext(
      1,
      Math.ceil(audioBuffer.duration * AudioPreprocessor.TARGET_SAMPLE_RATE),
      AudioPreprocessor.TARGET_SAMPLE_RATE
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const downsampledArray = new Float32Array(renderedBuffer.length);
    renderedBuffer.copyFromChannel(downsampledArray, 0);

    return downsampledArray.buffer;
  }

  private normalize(buffer: ArrayBuffer): ArrayBuffer {
    const array = new Float32Array(buffer);
    let maxVal = 0;

    // Find maximum absolute value
    for (let i = 0; i < array.length; i++) {
      maxVal = Math.max(maxVal, Math.abs(array[i]));
    }

    if (maxVal === 0) return buffer;

    // Normalize
    const scale = 0.99 / maxVal;
    for (let i = 0; i < array.length; i++) {
      array[i] *= scale;
    }

    return array.buffer;
  }

  private async generateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async checkCache(file: File): Promise<ArrayBuffer | null> {
    try {
      const hash = await this.generateHash(file);
      const key = AudioPreprocessor.CACHE_PREFIX + hash;
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check cache age
      if (Date.now() - timestamp > AudioPreprocessor.MAX_CACHE_AGE) {
        localStorage.removeItem(key);
        return null;
      }

      // Convert base64 to ArrayBuffer
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.warn('⚠️ Cache check failed:', error);
      return null;
    }
  }

  private async cacheAudio(file: File, processedBuffer: ArrayBuffer): Promise<void> {
    try {
      const hash = await this.generateHash(file);
      const key = AudioPreprocessor.CACHE_PREFIX + hash;

      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(processedBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      localStorage.setItem(key, JSON.stringify({
        data: base64,
        timestamp: Date.now()
      }));

      console.debug('✅ Cached preprocessed audio:', { hash, size: processedBuffer.byteLength });
    } catch (error) {
      console.warn('⚠️ Failed to cache audio:', error);
    }
  }
}
