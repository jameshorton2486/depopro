
export class WAVEncoder {
  static createWAVFile(pcmData: Int16Array): ArrayBuffer {
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    const channels = 1;
    const sampleRate = 16000;
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length * bytesPerSample;
    const fileSize = 36 + dataSize;

    // Write WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Combine header and PCM data
    const wavFile = new ArrayBuffer(wavHeader.byteLength + pcmData.byteLength);
    new Uint8Array(wavFile).set(new Uint8Array(wavHeader), 0);
    new Uint8Array(wavFile).set(new Uint8Array(pcmData.buffer), wavHeader.byteLength);

    return wavFile;
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
