
export class AudioCache {
  private static readonly CACHE_PREFIX = 'transcript_';
  private static readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

  static async generateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async checkCache(file: File): Promise<ArrayBuffer | null> {
    try {
      const hash = await this.generateHash(file);
      const key = this.CACHE_PREFIX + hash;
      const cached = localStorage.getItem(key);

      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      if (Date.now() - timestamp > this.MAX_CACHE_AGE) {
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

  static async cacheAudio(file: File, processedBuffer: ArrayBuffer): Promise<void> {
    try {
      const hash = await this.generateHash(file);
      const key = this.CACHE_PREFIX + hash;

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
