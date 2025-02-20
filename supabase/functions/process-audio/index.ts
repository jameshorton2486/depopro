
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
    const { audio, model, language } = await req.json();

    if (!audio) {
      throw new Error('Audio data is required');
    }

    // Convert ArrayBuffer to Base64 string before sending to Deepgram
    const audioData = new Uint8Array(audio);
    
    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: 'true',
      utterances: 'true',
      punctuate: 'true',
    });

    console.log('Preparing request to Deepgram...');

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
          'Content-Type': 'audio/mpeg', // Default to MP3, but we should ideally detect this
        },
        body: audioData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', errorText);
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Deepgram response:', JSON.stringify(result, null, 2));
    
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    console.log('Successfully processed audio');

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
