
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting audio processing...');
    
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      throw new Error('Deepgram API key is not configured');
    }

    // Parse the request body
    const { audio, mime_type, options } = await req.json();
    
    if (!audio || !mime_type) {
      throw new Error('Missing required audio data or mime type');
    }

    console.log('Received audio data:', {
      mimeType: mime_type,
      options: options
    });

    // Convert audio data to Uint8Array
    const audioData = new Uint8Array(audio);
    
    // Set up API request parameters
    const features = {
      model: options?.model || 'nova-2',
      language: options?.language || 'en-US',
      smart_format: true,
      punctuate: true,
      diarize: true,
      utterances: true
    };

    const queryString = new URLSearchParams(
      Object.entries(features).map(([key, value]) => [key, String(value)])
    ).toString();

    console.log('Making request to Deepgram with features:', features);

    // Make request to Deepgram API
    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryString}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mime_type,
        },
        body: audioData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', {
        status: response.status,
        text: errorText
      });
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response from Deepgram');
    }

    const result = data.results.channels[0].alternatives[0];
    console.log('Successfully processed audio');

    return new Response(
      JSON.stringify({
        transcript: result.transcript,
        utterances: result.paragraphs?.paragraphs || [],
        metadata: data.metadata
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error processing audio:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
