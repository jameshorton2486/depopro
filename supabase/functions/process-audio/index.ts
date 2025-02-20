
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FUNCTION_TIMEOUT = 25000; // 25 seconds, slightly less than Supabase's 30s limit

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      console.error('Deepgram API key not configured');
      return new Response(
        JSON.stringify({ error: 'Deepgram API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await req.json().catch(error => {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid request body');
    });

    const { audio, mime_type, options, isPartialChunk, chunkIndex, totalChunks } = body;

    if (!audio || !Array.isArray(audio)) {
      console.error('Invalid audio data format');
      return new Response(
        JSON.stringify({ error: 'Invalid audio data format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!mime_type) {
      console.error('MIME type is required');
      return new Response(
        JSON.stringify({ error: 'MIME type is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}`, {
      mimeType: mime_type,
      audioLength: audio.length,
      options
    });

    const deepgram = new Deepgram(deepgramKey);
    const audioData = new Uint8Array(audio);

    const source = {
      buffer: audioData,
      mimetype: mime_type,
    };

    const transcriptionPromise = deepgram.transcription.preRecorded(source, {
      ...options,
      punctuate: true,
      utterances: true,
      numerals: true
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Deepgram API timeout')), FUNCTION_TIMEOUT);
    });

    const response = await Promise.race([transcriptionPromise, timeoutPromise]);

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response structure from Deepgram API');
      throw new Error('Invalid response structure from Deepgram API');
    }

    const result = response.results.channels[0].alternatives[0];
    console.log(`Successfully processed chunk ${chunkIndex + 1}/${totalChunks}`);

    return new Response(
      JSON.stringify({
        transcript: result.transcript,
        metadata: {
          ...response.metadata,
          chunkIndex,
          totalChunks
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Processing error:", {
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
