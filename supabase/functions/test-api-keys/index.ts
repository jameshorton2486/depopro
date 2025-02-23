
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const results: Record<string, { status: string; message: string }> = {};

  try {
    // Test Deepgram API
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (deepgramKey) {
      try {
        const response = await fetch('https://api.deepgram.com/v1/projects', {
          method: 'GET',
          headers: {
            'Authorization': `Token ${deepgramKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          results.deepgram = { status: 'success', message: 'Deepgram API key is valid' };
        } else {
          results.deepgram = { status: 'error', message: 'Invalid Deepgram API key' };
        }
      } catch (error) {
        results.deepgram = { status: 'error', message: `Deepgram API error: ${error.message}` };
      }
    } else {
      results.deepgram = { status: 'error', message: 'Deepgram API key not configured' };
    }

    // Test OpenAI API
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          results.openai = { status: 'success', message: 'OpenAI API key is valid' };
        } else {
          results.openai = { status: 'error', message: 'Invalid OpenAI API key' };
        }
      } catch (error) {
        results.openai = { status: 'error', message: `OpenAI API error: ${error.message}` };
      }
    } else {
      results.openai = { status: 'error', message: 'OpenAI API key not configured' };
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
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
})
