
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeepgramError {
  err_code: string;
  err_msg: string;
  request_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting audio processing...');

    // Verify API key is present
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      console.error('Deepgram API key is missing');
      throw new Error('API key configuration error');
    }

    const { audio, model, language, mime_type } = await req.json();

    if (!audio) {
      console.error('No audio data received');
      throw new Error('Audio data is required');
    }

    if (!mime_type) {
      console.error('No MIME type specified');
      throw new Error('MIME type is required');
    }

    // Log request details
    console.log('Request details:', {
      model,
      language,
      mime_type,
      audioDataSize: audio.byteLength,
    });

    // Convert ArrayBuffer to Uint8Array for streaming
    const audioData = new Uint8Array(audio);
    console.log(`Processing audio data of size: ${audioData.length} bytes`);

    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: 'true',
      utterances: 'true',
      punctuate: 'true',
    });

    console.log('Sending request to Deepgram...');
    console.log('API URL:', `https://api.deepgram.com/v1/listen?${queryParams}`);

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mime_type,
        },
        body: audioData,
      }
    );

    // Log response status and headers
    console.log('Deepgram response status:', response.status);
    console.log('Deepgram response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorData = await response.json() as DeepgramError;
      console.error('Deepgram API error:', errorData);

      // Handle specific Deepgram error cases
      switch (response.status) {
        case 400:
          if (errorData.err_code === "Bad Request") {
            throw new Error("Invalid audio format or corrupted file");
          }
          throw new Error(errorData.err_msg || "Bad request");
        
        case 401:
          if (errorData.err_code === "INVALID_AUTH") {
            throw new Error("Invalid Deepgram API key");
          } else if (errorData.err_code === "INSUFFICIENT_PERMISSIONS") {
            throw new Error("Insufficient permissions for this operation");
          }
          throw new Error("Authentication failed");

        case 402:
          throw new Error("Insufficient credits in Deepgram account");

        case 403:
          throw new Error("No access to requested model");

        case 429:
          throw new Error("Too many requests. Please try again later");

        case 503:
          throw new Error("Deepgram service temporarily unavailable");

        default:
          throw new Error(`Deepgram API error: ${response.status} - ${errorData.err_msg || 'Unknown error'}`);
      }
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response structure from Deepgram:', result);
      throw new Error('Invalid response from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    console.log('Successfully processed audio. Transcript length:', transcript.length);

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    
    // Determine if this is a known error type
    const isDeepgramError = error.message.includes('Deepgram');
    const statusCode = isDeepgramError ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
