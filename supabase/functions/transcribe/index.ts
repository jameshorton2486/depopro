
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioData, fileName, options } = await req.json();

    if (!audioData) {
      throw new Error('No audio data provided');
    }

    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Deepgram API error:', error);
      throw new Error(`Deepgram API error: ${error}`);
    }

    const result = await response.json();
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcript) {
      throw new Error('No transcript received from Deepgram');
    }

    return new Response(
      JSON.stringify({ transcript }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
