
import { DeepgramClient } from 'https://esm.sh/@deepgram/sdk@2.4.0';

const deepgram = new DeepgramClient(Deno.env.get('DEEPGRAM_API_KEY') || '');

export async function processAudio(
  audioBytes: Uint8Array,
  mimeType: string,
  options: Record<string, any>
) {
  try {
    console.log('Processing audio with Deepgram:', {
      size: `${(audioBytes.length / 1024).toFixed(2)}KB`,
      mimeType,
      options
    });

    const response = await deepgram.listen.prerecorded.transcribeFile(
      audioBytes,
      {
        mimetype: mimeType,
        ...options
      }
    );

    console.log('Deepgram response received:', {
      channels: response.results?.channels?.length,
      metadata: response.metadata
    });

    // Extract transcript from the response
    const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return {
      transcript,
      metadata: response.metadata
    };
  } catch (error) {
    console.error('Deepgram processing error:', error);
    throw new Error(`Deepgram API error: ${error.message}`);
  }
}
