
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.debug('📥 Received transcription request');

  try {
    // Get file from request
    console.debug('🔄 Parsing form data');
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const options = formData.get('options');
    
    console.debug('📊 Request details:', {
      hasAudioFile: !!audioFile,
      audioFileType: audioFile instanceof Blob ? audioFile.type : typeof audioFile,
      optionsPresent: !!options,
      optionsType: typeof options
    });
    
    if (!audioFile || !(audioFile instanceof Blob)) {
      console.error('❌ Invalid or missing audio file');
      throw new Error('No audio file provided');
    }

    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramApiKey) {
      console.error('❌ Deepgram API key not configured');
      throw new Error('Deepgram API key not configured');
    }
    console.debug('✅ Deepgram API key found');

    // Forward the request to Deepgram
    console.debug('🚀 Sending request to Deepgram API');
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
      },
      body: formData
    });

    console.debug('📊 Deepgram response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Deepgram API error:', error);
      throw new Error(error.message || 'Failed to process audio');
    }

    const data = await response.json();
    console.debug('✅ Successfully received Deepgram response');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in transcribe function:', {
      error: error.message,
      stack: error.stack,
      type: error.name
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
