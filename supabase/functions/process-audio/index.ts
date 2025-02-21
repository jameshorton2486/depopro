
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Deepgram } from "https://esm.sh/@deepgram/sdk@3.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processAudio(audioData: number[], mimeType: string, options: any) {
  try {
    const deepgram = new Deepgram(Deno.env.get('DEEPGRAM_API_KEY')!);
    
    // Convert number array back to Uint8Array
    const audioBuffer = new Uint8Array(audioData);

    // Set up source object
    const source = {
      buffer: audioBuffer,
      mimetype: mimeType
    };

    // Ensure options are properly formatted
    const deepgramOptions = {
      smart_format: true,
      model: options.model || "nova-2",
      language: options.language || "en",
      punctuate: options.punctuate !== false,
      utterances: false,
      ...options,
      diarize: options.diarize === true
    };

    if (deepgramOptions.diarize) {
      deepgramOptions.diarize_version = "3";
    }

    console.log("🎯 Sending to Deepgram:", { 
      mimeType, 
      options: deepgramOptions,
      bufferSize: audioBuffer.length
    });

    const result = await deepgram.transcription.preRecorded(source, deepgramOptions);

    console.log("✅ Received response from Deepgram");

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error("Invalid response format from Deepgram");
    }

    return {
      transcript: result.results.channels[0].alternatives[0].transcript,
      metadata: {
        duration: result.metadata?.duration,
        channels: result.metadata?.channels,
        model: result.metadata?.model,
        processed_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("❌ Error processing audio:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mime_type, options } = await req.json();

    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid audio data: must be an array of numbers');
    }

    if (!mime_type || typeof mime_type !== 'string') {
      throw new Error('Invalid mime_type: must be a string');
    }

    // Process the audio data
    const result = await processAudio(audio, mime_type, options || {});

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
