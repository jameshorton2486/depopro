
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { createClient as createDeepgramClient } from "https://esm.sh/@deepgram/sdk@3.0.0"

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
        const deepgram = createDeepgramClient(deepgramKey);
        const response = await deepgram.manage.getProjects();
        
        if (response) {
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

    // Test Supabase connection
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase.from('transcription_data').select('count(*)', { count: 'exact', head: true });
        
        if (!error) {
          results.supabase = { status: 'success', message: 'Supabase connection is working' };
        } else {
          results.supabase = { status: 'error', message: `Supabase error: ${error.message}` };
        }
      } catch (error) {
        results.supabase = { status: 'error', message: `Supabase error: ${error.message}` };
      }
    } else {
      results.supabase = { status: 'error', message: 'Supabase credentials not configured' };
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
