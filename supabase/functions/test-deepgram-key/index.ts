
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
    console.debug('Starting API keys test...');

    // Test Deepgram API Key
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    console.debug('Testing Deepgram API connectivity...');
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${deepgramKey}`,
      }
    });

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text();
      throw new Error(`Deepgram API test failed: ${deepgramResponse.status} - ${errorText}`);
    }

    // Test Supabase connection using service role key
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!supabaseKey || !supabaseUrl) {
      throw new Error('Supabase configuration is incomplete');
    }

    console.debug('Testing Supabase connectivity...');
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase API test failed: ${supabaseResponse.status}`);
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'All API keys are valid and working',
        tests: {
          deepgram: 'passed',
          supabase: 'passed'
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('API test error:', error);
    
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
    );
  }
});
