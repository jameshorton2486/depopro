
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting audio processing...');

    // Verify API key is present
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      console.error('Deepgram API key is missing');
      throw new Error('API key configuration error');
    }

    const { audio, model, language, mime_type } = await req.json();

    if (!audio) {
      console.error('No audio data received');
      throw new Error('Audio data is required');
    }

    // Log request details
    console.log('Request details:', {
      model,
      language,
      mime_type,
      audioDataSize: audio.byteLength,
    });

    // Convert ArrayBuffer to Uint8Array for streaming
    const audioData = new Uint8Array(audio);
    console.log(`Processing audio data of size: ${audioData.length} bytes`);

    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: 'true',
      utterances: 'true',
      punctuate: 'true',
    });

    console.log('Sending request to Deepgram...');
    console.log('API URL:', `https://api.deepgram.com/v1/listen?${queryParams}`);

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mime_type || 'audio/mpeg',
        },
        body: audioData,
      }
    );

    // Log response status and headers
    console.log('Deepgram response status:', response.status);
    console.log('Deepgram response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error response:', errorText);
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response structure from Deepgram:', result);
      throw new Error('Invalid response from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    console.log('Successfully processed audio. Transcript length:', transcript.length);

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    // Include error stack trace if available
    const errorDetails = error.stack || error.message;
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: errorDetails,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
