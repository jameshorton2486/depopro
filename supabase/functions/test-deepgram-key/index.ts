
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
    console.log('Starting API keys test...');

    // Test Deepgram API Key
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      console.error('DEEPGRAM_API_KEY not found in environment variables');
      throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    console.log('Testing Deepgram API connectivity...');
    
    try {
      const deepgramResponse = await fetch('https://api.deepgram.com/v1/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${deepgramKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Deepgram API response status:', deepgramResponse.status);

      if (!deepgramResponse.ok) {
        const errorText = await deepgramResponse.text();
        console.error('Deepgram API error response:', errorText);
        throw new Error(`Deepgram API test failed: Status ${deepgramResponse.status} - ${errorText}`);
      }

      const deepgramData = await deepgramResponse.json();
      console.log('Deepgram API test successful:', deepgramData);
    } catch (deepgramError) {
      console.error('Error testing Deepgram API:', deepgramError);
      throw new Error(`Deepgram API test failed: ${deepgramError.message}`);
    }

    // Test Supabase connection using service role key
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!supabaseKey || !supabaseUrl) {
      console.error('Missing Supabase configuration');
      throw new Error('Supabase configuration is incomplete');
    }

    console.log('Testing Supabase connectivity...');
    
    try {
      const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });

      console.log('Supabase API response status:', supabaseResponse.status);

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error('Supabase API error response:', errorText);
        throw new Error(`Supabase API test failed: Status ${supabaseResponse.status}`);
      }
    } catch (supabaseError) {
      console.error('Error testing Supabase API:', supabaseError);
      throw new Error(`Supabase API test failed: ${supabaseError.message}`);
    }

    console.log('All API tests completed successfully');

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
