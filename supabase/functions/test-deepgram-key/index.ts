
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting Deepgram API key verification...');
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');

    if (!apiKey) {
      console.error('DEEPGRAM_API_KEY not found in environment variables');
      throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    console.log('Testing Deepgram API key by making a request to /v1/projects...');
    
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('Deepgram API Response Status:', response.status);
    console.log('Deepgram API Response:', responseText);

    if (!response.ok) {
      throw new Error(`Deepgram API returned status ${response.status}: ${responseText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error('Invalid response format from Deepgram API');
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Deepgram API key is valid and working',
        details: responseData
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error testing Deepgram API:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
