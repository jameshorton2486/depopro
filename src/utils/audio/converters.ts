
export class AudioConverters {
  static convertToMono(audioBuffer: AudioBuffer): Float32Array {
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

  static async resample(audioData: Float32Array, context: AudioContext): Promise<Float32Array> {
    const offlineContext = new OfflineAudioContext(
      1,
      Math.ceil(audioData.length * (16000 / context.sampleRate)),
      16000
    );

    const source = offlineContext.createBufferSource();
    const buffer = context.createBuffer(1, audioData.length, context.sampleRate);
    buffer.copyToChannel(audioData, 0);
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const resampledData = new Float32Array(renderedBuffer.length);
    renderedBuffer.copyFromChannel(resampledData, 0);

    return resampledData;
  }

  static convertToPCM16(float32Audio: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Audio.length);
    for (let i = 0; i < float32Audio.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Audio[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }
}
