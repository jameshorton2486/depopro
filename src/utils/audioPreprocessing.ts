
export class AudioPreprocessor {
  private context: AudioContext;
  private static readonly TARGET_SAMPLE_RATE = 16000;
  private static readonly TARGET_BIT_DEPTH = 16;
  private static readonly CACHE_PREFIX = 'transcript_';
  private static readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.context = new AudioContext({ sampleRate: AudioPreprocessor.TARGET_SAMPLE_RATE });
  }

  async preprocessAudio(file: File): Promise<ArrayBuffer> {
    console.debug('🎵 Starting audio preprocessing:', {
      originalSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type,
      name: file.name
    });

    try {
      // Check cache first
      const cachedResult = await this.checkCache(file);
      if (cachedResult) {
        console.debug('✨ Found cached preprocessed audio');
        return cachedResult;
      }

      const arrayBuffer = await file.arrayBuffer();
      console.debug('📊 Original audio details:', {
        size: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        type: file.type
      });

      // Decode the audio data
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      console.debug('🔍 Audio properties:', {
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });

      // Convert to mono if needed
      const monoBuffer = this.convertToMono(audioBuffer);
      
      // Resample to 16kHz if needed
      const resampledBuffer = await this.resample(monoBuffer);
      
      // Convert to 16-bit PCM
      const pcmBuffer = this.convertToPCM16(resampledBuffer);
      
      // Create WAV header
      const wavBuffer = this.createWAVFile(pcmBuffer);

      // Cache the result
      await this.cacheAudio(file, wavBuffer);

      console.debug('✅ Audio preprocessing complete:', {
        originalSize: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        processedSize: `${(wavBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        sampleRate: AudioPreprocessor.TARGET_SAMPLE_RATE,
        bitDepth: AudioPreprocessor.TARGET_BIT_DEPTH,
        channels: 1
      });

      return wavBuffer;
    } catch (error) {
      console.error('❌ Error preprocessing audio:', error);
      throw error;
    }
  }

  private convertToMono(audioBuffer: AudioBuffer): Float32Array {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const monoData = new Float32Array(length);

    // If already mono, just return the data
    if (channels === 1) {
      audioBuffer.copyFromChannel(monoData, 0);
      return monoData;
    }

    // Mix down to mono
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let channel = 0; channel < channels; channel++) {
        sum += audioBuffer.getChannelData(channel)[i];
      }
      monoData[i] = sum / channels;
    }

    return monoData;
  }

  private async resample(audioData: Float32Array): Promise<Float32Array> {
    const offlineContext = new OfflineAudioContext(
      1,
      Math.ceil(audioData.length * (AudioPreprocessor.TARGET_SAMPLE_RATE / this.context.sampleRate)),
      AudioPreprocessor.TARGET_SAMPLE_RATE
    );

    const source = offlineContext.createBufferSource();
    const buffer = this.context.createBuffer(1, audioData.length, this.context.sampleRate);
    buffer.copyToChannel(audioData, 0);
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const resampledData = new Float32Array(renderedBuffer.length);
    renderedBuffer.copyFromChannel(resampledData, 0);

    return resampledData;
  }

  private convertToPCM16(float32Audio: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Audio.length);
    for (let i = 0; i < float32Audio.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Audio[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  private createWAVFile(pcmData: Int16Array): ArrayBuffer {
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // WAV header creation
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const channels = 1;
    const sampleRate = AudioPreprocessor.TARGET_SAMPLE_RATE;
    const bytesPerSample = 2; // 16-bit = 2 bytes
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length * bytesPerSample;
    const fileSize = 36 + dataSize;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, AudioPreprocessor.TARGET_BIT_DEPTH, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Combine header and PCM data
    const wavFile = new ArrayBuffer(wavHeader.byteLength + pcmData.byteLength);
    new Uint8Array(wavFile).set(new Uint8Array(wavHeader), 0);
    new Uint8Array(wavFile).set(new Uint8Array(pcmData.buffer), wavHeader.byteLength);

    return wavFile;
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
      
      if (Date.now() - timestamp > AudioPreprocessor.MAX_CACHE_AGE) {
        localStorage.removeItem(key);
        return null;
      }

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

      console.debug('✅ Cached preprocessed audio:', {
        hash,
        size: processedBuffer.byteLength
      });
    } catch (error) {
      console.warn('⚠️ Failed to cache audio:', error);
    }
  }
}
