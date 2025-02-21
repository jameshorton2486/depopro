
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('Deepgram API key not configured');
    }

    const { audio, mime_type, options } = await req.json();

    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid audio data format');
    }

    if (!mime_type) {
      throw new Error('Missing mime_type in request');
    }

    console.log("Processing audio chunk:", {
      mimeType: mime_type,
      audioLength: audio.length,
      options: JSON.stringify(options, null, 2)
    });

    const deepgram = new Deepgram(deepgramKey);
    const source = {
      buffer: new Uint8Array(audio),
      mimetype: mime_type,
    };

    const response = await deepgram.transcription.preRecorded(source, {
      ...options,
      smart_format: true,
      punctuate: true,
      utterances: true,
      numerals: true,
    });

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response from Deepgram');
    }

    const transcript = response.results.channels[0].alternatives[0].transcript;
    console.log("Transcription successful, length:", transcript.length);

    return new Response(
      JSON.stringify({ transcript, metadata: response.metadata }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error("Error processing request:", error);
    
    const statusCode = error.message.includes('Invalid audio data') ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
