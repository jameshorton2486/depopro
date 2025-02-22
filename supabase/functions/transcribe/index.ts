
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const optionsJson = formData.get('options');
    
    if (!audioFile || !(audioFile instanceof Blob)) {
      console.error('❌ Invalid or missing audio file');
      throw new Error('No audio file provided');
    }

    const options = optionsJson ? JSON.parse(optionsJson as string) : {};
    console.debug('🎛️ Transcription options:', options);

    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramApiKey) {
      console.error('❌ Deepgram API key not configured');
      throw new Error('Deepgram API key not configured');
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBytes = new Uint8Array(arrayBuffer);

    // Send to Deepgram
    console.debug('🚀 Sending request to Deepgram API');
    const response = await fetch('https://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: options.model || 'nova-2',
      language: options.language || 'en',
      smart_format: options.smart_format ? 'true' : 'false',
      diarize: options.diarize ? 'true' : 'false',
      punctuate: options.punctuate ? 'true' : 'false'
    }), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': audioFile.type
      },
      body: audioBytes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Deepgram API error: ${errorText}`);
    }

    const data = await response.json();
    console.debug('✅ Successfully received Deepgram response');

    if (!data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      throw new Error('Invalid response format from Deepgram');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in transcribe function:', {
      message: error.message,
      stack: error.stack,
      type: error.name
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to process audio file'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
