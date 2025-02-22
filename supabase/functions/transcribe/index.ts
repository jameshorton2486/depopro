
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
    console.log('📥 Received transcription request');

    // Get file from request
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const optionsJson = formData.get('options');
    
    console.log('📊 Request details:', {
      hasAudioFile: !!audioFile,
      audioFileType: audioFile instanceof Blob ? audioFile.type : typeof audioFile,
      optionsPresent: !!optionsJson,
      formDataKeys: [...formData.keys()]
    });
    
    if (!audioFile || !(audioFile instanceof Blob)) {
      throw new Error('No valid audio file provided');
    }

    const options = optionsJson ? JSON.parse(optionsJson as string) : {};
    console.log('🎛️ Transcription options:', options);

    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramApiKey) {
      throw new Error('Deepgram API key not configured');
    }
    console.log('✅ Deepgram API key found');

    // Convert Blob to ArrayBuffer
    const buffer = await audioFile.arrayBuffer();
    console.log('📦 Audio file size:', `${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // Send to Deepgram
    console.log('🚀 Sending request to Deepgram API');
    const response = await fetch('https://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: options.model || 'nova-2',
      language: options.language || 'en',
      smart_format: 'true',
      diarize: options.diarize ? 'true' : 'false',
      punctuate: 'true'
    }), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': audioFile.type || 'audio/wav'
      },
      body: buffer
    });

    console.log('📊 Deepgram response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Deepgram API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully received Deepgram response');

    if (!data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      console.error('❌ Invalid Deepgram response format:', data);
      throw new Error('Invalid response format from Deepgram');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in transcribe function:', {
      message: error.message,
      stack: error.stack
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
