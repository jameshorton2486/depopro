
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

    // Detailed request validation logging
    console.log('🔍 Validating request data:', {
      hasAudio: !!audio,
      audioType: typeof audio,
      isArray: Array.isArray(audio),
      mimeType: mime_type,
      options: JSON.stringify(options, null, 2),
      timestamp: new Date().toISOString()
    });

    if (!audio || !Array.isArray(audio)) {
      console.error('❌ Invalid audio data:', { 
        audioPresent: !!audio,
        audioType: typeof audio,
        isArray: Array.isArray(audio)
      });
      throw new Error('Invalid audio data: must be an array of numbers');
    }

    if (!mime_type || typeof mime_type !== 'string') {
      console.error('❌ Invalid mime_type:', { 
        mimeTypePresent: !!mime_type,
        mimeTypeValue: mime_type,
        type: typeof mime_type 
      });
      throw new Error('Invalid mime_type: must be a string');
    }

    // Log audio data characteristics
    console.log('📊 Audio data statistics:', {
      arrayLength: audio.length,
      firstFewBytes: audio.slice(0, 5),
      mimeType: mime_type,
      timestamp: new Date().toISOString()
    });

    // Convert number array back to Uint8Array
    const audioBuffer = new Uint8Array(audio);

    console.log('🔄 Converted to Uint8Array:', {
      bufferLength: audioBuffer.length,
      firstFewBytes: Array.from(audioBuffer.slice(0, 5)),
      timestamp: new Date().toISOString()
    });

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

    const requestUrl = `${url}?${queryParams.toString()}`;
    console.log('📡 Sending request to Deepgram:', {
      url: requestUrl,
      headers: {
        ...headers,
        'Authorization': 'Token [REDACTED]'
      },
      contentLength: audioBuffer.length,
      mimeType: mime_type,
      options: queryParams.toString(),
      timestamp: new Date().toISOString()
    });

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: audioBuffer
    });

    const responseText = await response.text();
    console.log('📥 Raw response from Deepgram:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.slice(0, 1000) + (responseText.length > 1000 ? '...' : ''),
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      console.error('❌ Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.error('❌ Failed to parse Deepgram response:', {
        error: error.message,
        responseText: responseText.slice(0, 1000),
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid JSON response from Deepgram');
    }
    
    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('❌ Invalid response format from Deepgram:', {
        result: JSON.stringify(result, null, 2),
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid response format from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;

    console.log('✅ Successfully processed audio:', {
      transcriptLength: transcript.length,
      sampleText: transcript.slice(0, 100) + (transcript.length > 100 ? '...' : ''),
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
