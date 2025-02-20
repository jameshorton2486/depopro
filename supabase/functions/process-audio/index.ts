
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
    const processingPromise = processAudioRequest(req);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout')), FUNCTION_TIMEOUT);
    });

    const response = await Promise.race([processingPromise, timeoutPromise]);
    return response;
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
        status: error.message === 'Function timeout' ? 408 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function processAudioRequest(req: Request): Promise<Response> {
  const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
  if (!deepgramKey) {
    throw new Error('Deepgram API key not configured');
  }

  const body = await req.json();
  const { audio, mime_type, options, isPartialChunk, chunkIndex, totalChunks } = body;

  if (!audio || !mime_type) {
    throw new Error('Audio data and MIME type are required');
  }

  console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks}`);

  const deepgram = new Deepgram(deepgramKey);
  const audioData = new Uint8Array(audio);

  const source = {
    buffer: audioData,
    mimetype: mime_type,
  };

  try {
    const response = await deepgram.transcription.preRecorded(source, {
      ...options,
      punctuate: true,
      utterances: true,
      numerals: true
    });

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
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
    console.error(`Deepgram API error for chunk ${chunkIndex + 1}:`, error);
    throw error;
  }
}
