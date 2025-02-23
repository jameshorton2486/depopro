
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { options, fileName, audioType } = await req.json();

    // Get the audio data from Storage using the file path
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');

    if (!apiKey) {
      throw new Error('Deepgram API key not configured');
    }

    console.log('Transcribing audio with options:', { fileName, audioType, options });

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': audioType,
      },
      body: JSON.stringify({
        url: `${supabaseUrl}/storage/v1/object/public/transcriptions/${fileName}`,
        options: {
          ...options,
          model: options.model || 'nova-meeting',
          language: options.language || 'en-US',
          smart_format: true,
          utterances: false,
          punctuate: true,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Deepgram API error:', error);
      throw new Error(`Deepgram API error: ${error}`);
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
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
})
