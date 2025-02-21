
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');

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

    if (!audio || !Array.isArray(audio)) {
      console.error('❌ Invalid audio data:', { audio: typeof audio });
      throw new Error('Invalid audio data: must be an array of numbers');
    }

    if (!mime_type || typeof mime_type !== 'string') {
      console.error('❌ Invalid mime_type:', { mime_type });
      throw new Error('Invalid mime_type: must be a string');
    }

    console.log('🎯 Processing audio chunk:', {
      audioLength: audio.length,
      mimeType: mime_type,
      options: JSON.stringify(options)
    });

    // Convert number array back to Uint8Array
    const audioBuffer = new Uint8Array(audio);

    // Prepare the request URL and headers
    const url = 'https://api.deepgram.com/v1/listen';
    const headers = {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': mime_type
    };

    // Prepare query parameters based on options
    const queryParams = new URLSearchParams({
      model: options?.model || 'nova-2',
      language: options?.language || 'en',
      smart_format: 'true',
      punctuate: (options?.punctuate !== false).toString()
    });

    if (options?.diarize) {
      queryParams.append('diarize', 'true');
      if (options.diarize_version) {
        queryParams.append('diarize_version', options.diarize_version);
      }
    }

    console.log('📡 Sending to Deepgram API:', {
      url: `${url}?${queryParams.toString()}`,
      contentLength: audioBuffer.length,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'POST',
      headers,
      body: audioBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('❌ Invalid response format from Deepgram:', result);
      throw new Error('Invalid response format from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;

    console.log('✅ Successfully processed audio chunk:', {
      transcriptLength: transcript.length,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        transcript,
        metadata: {
          duration: result.metadata?.duration,
          channels: result.metadata?.channels,
          model: result.metadata?.model,
          processed_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Server error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
