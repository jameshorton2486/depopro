
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1"

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

    // Create a small test audio buffer
    const testAudioData = new Uint8Array([0, 0, 0, 0]); // Empty audio sample
    const deepgram = new Deepgram(key);

    try {
      // First test: Basic API connectivity
      const response = await fetch("https://api.deepgram.com/v1/projects", {
        method: "GET",
        headers: {
          "Authorization": `Token ${key}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`API connectivity test failed with status ${response.status}`);
      }

      // Second test: Attempt a minimal transcription
      const source = {
        buffer: testAudioData,
        mimetype: 'audio/wav',
      };

      await deepgram.transcription.preRecorded(source, {
        smart_format: true,
        model: "nova-2",
      });

      console.log('Deepgram API key verified successfully');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'API key is valid and has necessary permissions'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (apiError) {
      console.error('API test failed:', apiError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid or unauthorized API key',
          details: apiError.message
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
