
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

    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: 'true',
      utterances: 'true',
      punctuate: 'true',
    });

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
          'Content-Type': 'audio/wav',
        },
        body: audio,
      }
    );

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const result = await response.json();
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
