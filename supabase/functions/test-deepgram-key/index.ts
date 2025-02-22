
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify Deepgram API key is configured
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY')
    if (!apiKey) {
      throw new Error('Deepgram API key not configured')
    }

    // Test Deepgram API connectivity
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Deepgram API test failed:', error);
      throw new Error(`Deepgram API returned error: ${error}`);
    }

    console.log('✅ Deepgram API key is valid and working');
    
    return new Response(
      JSON.stringify({ 
        message: 'Deepgram API key is valid and working',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error testing Deepgram API:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
