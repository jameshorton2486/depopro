
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    if (!chunk || chunk.size === 0) {
      throw new Error('Invalid audio chunk');
    }

    console.debug('Sending audio chunk to Deepgram:', {
      size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
      type: chunk.type,
      options: JSON.stringify(options, null, 2)
    });

    const arrayBuffer = await chunk.arrayBuffer();

    // Preserve user options while ensuring diarize_version when diarize is true
    const requestOptions = {
      ...options,
      diarize_version: options.diarize ? "3" : undefined
    };

    console.debug('Sending request with options:', requestOptions);

    try {
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: {
          audio: Array.from(new Uint8Array(arrayBuffer)),
          mime_type: chunk.type,
          options: requestOptions
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No response received from Supabase function');
      }

      if (!data.transcript) {
        console.error('No transcript in response:', data);
        throw new Error('No transcript received from Deepgram');
      }

      console.debug('Received response:', {
        transcriptLength: data.transcript.length,
        metadata: data.metadata,
        storedFileName: data.storedFileName
      });

      return {
        transcript: data.transcript,
        metadata: data.metadata,
        storedFileName: data.storedFileName
      };
    } catch (error) {
      console.error('Network or processing error:', error);
      throw new Error(`Failed to process audio: ${error.message}`);
    }
  } catch (error) {
    console.error("Error processing chunk:", error);
    throw error;
  }
};
