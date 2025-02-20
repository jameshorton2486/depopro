
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const key = Deno.env.get('DEEPGRAM_API_KEY');
    
    // Check if key exists in environment
    if (!key) {
      console.error('DEEPGRAM_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Deepgram API key not configured',
          details: 'The API key is missing from the environment variables'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Testing Deepgram API key...');

    // Test the key by making a request to Deepgram
    const response = await fetch("https://api.deepgram.com/v1/projects", {
      method: "GET",
      headers: {
        "Authorization": `Token ${key}`,
        "Content-Type": "application/json"
      }
    });

    const responseData = await response.json().catch(() => null);

    // Handle different response scenarios
    if (response.status === 401 || response.status === 403) {
      console.error('Invalid or unauthorized Deepgram API key');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid API key',
          details: 'The provided API key is invalid or unauthorized'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      console.error(`Deepgram API error: ${response.status}`, responseData);
      return new Response(
        JSON.stringify({ 
          error: 'Deepgram API error',
          details: `Server returned status ${response.status}`,
          response: responseData
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Deepgram API key verified successfully');
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'API key verified successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error while testing Deepgram key:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
