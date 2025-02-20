
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
    const key = Deno.env.get('DEEPGRAM_API_KEY');
    if (!key) {
      throw new Error('Deepgram API key not found');
    }

    // Test the key by making a simple request to Deepgram
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      method: "GET",
      headers: {
        "Authorization": `Token ${key}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    // Return success without exposing the key
    return new Response(
      JSON.stringify({ 
        success: true, 
        key // This will be used by the frontend but should not be logged
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error testing Deepgram key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
