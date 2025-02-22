
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

  try {
    console.log('🔍 Request details:', {
      method: req.method,
      contentType: req.headers.get('content-type'),
      url: req.url
    });

    // Get file from request
    console.log('📥 Parsing form data...');
    const formData = await req.formData();
    console.log('📦 Form data keys:', [...formData.keys()]);

    const audioFile = formData.get('audio');
    const optionsJson = formData.get('options');
    
    if (!audioFile) {
      console.error('❌ No audio file provided');
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    if (!(audioFile instanceof Blob)) {
      console.error('❌ Invalid audio file format');
      return new Response(
        JSON.stringify({ error: 'Invalid audio file format' }), 
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📊 Audio file details:', {
      type: audioFile.type,
      size: `${audioFile.size / 1024 / 1024}MB`
    });

    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramApiKey) {
      console.error('❌ Deepgram API key not configured');
      return new Response(
        JSON.stringify({ error: 'Deepgram API key not configured' }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse options with defaults
    const options = optionsJson ? JSON.parse(optionsJson as string) : {};
    console.log('🔧 Processing options:', {
      ...options,
      apiKeyPresent: !!deepgramApiKey
    });

    // Convert Blob to ArrayBuffer
    console.log('🔄 Converting audio to buffer...');
    const buffer = await audioFile.arrayBuffer();
    console.log('✅ Buffer created:', `${buffer.byteLength / 1024 / 1024}MB`);

    // Prepare Deepgram request
    const params = new URLSearchParams({
      model: options.model || 'nova-2',
      language: options.language || 'en',
      smart_format: 'true',
      diarize: 'false',
      punctuate: 'true'
    });

    console.log('🚀 Sending request to Deepgram:', {
      url: 'https://api.deepgram.com/v1/listen?' + params.toString(),
      contentType: audioFile.type || 'audio/wav',
      bufferSize: `${buffer.byteLength / 1024 / 1024}MB`
    });

    const response = await fetch('https://api.deepgram.com/v1/listen?' + params.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': audioFile.type || 'audio/wav'
      },
      body: buffer
    });

    console.log('📨 Deepgram response status:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      return new Response(
        JSON.stringify({ 
          error: 'Deepgram API error', 
          details: errorText,
          status: response.status 
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    
    if (!data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      console.error('❌ Invalid Deepgram response format:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from Deepgram',
          details: data 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ Transcription successful');
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message,
        type: error.name
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
