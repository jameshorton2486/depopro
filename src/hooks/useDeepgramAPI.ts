
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    console.log('Sending audio chunk to Deepgram:', {
      size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
      type: chunk.type,
      options: JSON.stringify(options, null, 2)
    });

    const arrayBuffer = await chunk.arrayBuffer();

    // Force all boolean options to true
    const requestOptions = {
      model: options.model,
      language: options.language,
      smart_format: true,
      punctuate: true,
      diarize: true,
      diarize_version: "3",
      filler_words: true,
      detect_language: true
    };

    console.log('Sending request with options:', requestOptions);

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

    if (!data?.transcript) {
      console.error('No transcript in response:', data);
      throw new Error('No transcript received from Deepgram');
    }

    console.log('Received response:', {
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
    console.error("Error processing chunk:", error);
    throw error;
  }
};
