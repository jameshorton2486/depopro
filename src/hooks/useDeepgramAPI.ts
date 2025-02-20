
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    console.log('Sending audio chunk to Deepgram:', {
      size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
      type: chunk.type,
      options
    });

    const arrayBuffer = await chunk.arrayBuffer();

    const { data, error } = await supabase.functions.invoke('process-audio', {
      body: {
        audio: Array.from(new Uint8Array(arrayBuffer)),
        mime_type: chunk.type,
        options: {
          model: options.model,
          language: options.language,
          smart_format: options.smart_format,
          punctuate: options.punctuate,
          diarize: options.diarize,
          utterances: options.utterances,
          filler_words: options.filler_words,
          detect_language: options.detect_language
        }
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (!data?.transcript) {
      console.error('No transcript in response:', data);
      throw new Error('No transcript received from Deepgram');
    }

    return {
      transcript: data.transcript,
      utterances: data.utterances || [],
      metadata: data.metadata
    };
  } catch (error) {
    console.error("Error processing chunk:", error);
    throw error;
  }
};
