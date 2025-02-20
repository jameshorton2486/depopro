
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mime_type, options } = await req.json();

    if (!audio || !mime_type) {
      console.error('Missing required audio data or mime type');
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
      console.error('Deepgram API key not configured');
      throw new Error('Deepgram API key not configured');
    }

    console.log('Initializing Deepgram with provided credentials');
    const deepgram = new Deepgram(deepgramKey);

    const audioData = new Uint8Array(audio);
    console.log('Processing audio file of size:', audioData.length, 'bytes');

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

    console.log('Sending request to Deepgram with options:', JSON.stringify(deepgramOptions));

    const response = await deepgram.transcription.preRecorded(source, deepgramOptions);
    console.log('Received response from Deepgram');

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response from Deepgram API:', response);
      throw new Error('Invalid response from Deepgram API');
    }

    const result = response.results.channels[0].alternatives[0];
    console.log('Successfully processed transcript with confidence:', result.confidence);

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
    console.error('Error processing audio:', error);
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
