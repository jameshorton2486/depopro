
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mime_type, options } = await req.json();

    if (!audio || !mime_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required audio data or mime type' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('Deepgram API key not configured');
    }

    const deepgram = new Deepgram(deepgramKey);
    const audioData = new Uint8Array(audio);

    const source = {
      buffer: audioData,
      mimetype: mime_type,
    };

    // Use provided options with safe defaults
    const deepgramOptions = {
      model: options?.model || "nova-3",
      language: options?.language || "en-US",
      smart_format: options?.smart_format ?? true,
      punctuate: options?.punctuate ?? true,
      diarize: options?.diarize ?? true,
      diarize_version: options?.diarize ? "3" : undefined,
      filler_words: options?.filler_words ?? true,
      detect_language: options?.detect_language ?? true
    };

    console.log('Processing audio with options:', deepgramOptions);

    const response = await deepgram.transcription.preRecorded(source, deepgramOptions);

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response from Deepgram API');
    }

    const result = response.results.channels[0].alternatives[0];

    return new Response(
      JSON.stringify({
        transcript: result.transcript,
        metadata: response.metadata,
        words: result.words,
        confidence: result.confidence
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
