
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { processAudio } from "./processAudio.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mime_type, options } = await req.json();

    if (!audio || !mime_type) {
      throw new Error('Missing required parameters');
    }

    // Convert array back to Uint8Array for Deepgram
    const audioBytes = new Uint8Array(audio);

    const result = await processAudio(audioBytes, mime_type, options);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing audio:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
