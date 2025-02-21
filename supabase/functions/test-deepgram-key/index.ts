
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("Function started:", req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    
    if (!deepgramKey) {
      throw new Error('DEEPGRAM_API_KEY is not configured in environment variables');
    }

    console.log('Testing Deepgram API with key length:', deepgramKey.length);
    
    // First, let's verify the key format
    if (!deepgramKey.startsWith('')) {
      throw new Error('Invalid Deepgram API key format. Key should start with "". Please check your key.');
    }

    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${deepgramKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();
    console.log('Deepgram API Response Status:', response.status);
    
    // Log a safe version of the response for debugging
    try {
      const responseData = JSON.parse(responseText);
      console.log('Deepgram API Response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('Raw response text:', responseText);
    }

    if (!response.ok) {
      throw new Error(`Deepgram API returned status ${response.status}: ${responseText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deepgram API key is valid and working',
        status: response.status
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check the function logs for more information'
      }),
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
