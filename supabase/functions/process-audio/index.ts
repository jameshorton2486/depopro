
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

    console.log('Got request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    let requestData;
    try {
      requestData = await req.json();
      console.log('Successfully parsed request JSON');
    } catch (e) {
      console.error('Failed to parse request JSON:', e);
      throw new Error('Invalid request format');
    }

    const { audio, model, language, mime_type } = requestData;

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
    let audioData;
    try {
      audioData = new Uint8Array(audio);
      console.log(`Successfully created Uint8Array of size: ${audioData.length} bytes`);
    } catch (e) {
      console.error('Failed to convert audio data to Uint8Array:', e);
      throw new Error('Failed to process audio data');
    }

    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: 'true',
      utterances: 'true',
      punctuate: 'true',
    });

    console.log('Preparing Deepgram request...');
    console.log('API URL:', `https://api.deepgram.com/v1/listen?${queryParams}`);

    let response;
    try {
      response = await fetch(
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
      console.log('Deepgram response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (e) {
      console.error('Failed to make Deepgram API request:', e);
      throw new Error('Failed to communicate with Deepgram');
    }

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json() as DeepgramError;
        console.error('Deepgram API error:', errorData);
      } catch (e) {
        console.error('Failed to parse Deepgram error response:', e);
        throw new Error(`Deepgram API error: ${response.status} - ${response.statusText}`);
      }

      switch (response.status) {
        case 400:
          throw new Error(errorData.err_msg || "Invalid request to Deepgram");
        case 401:
          throw new Error("Invalid Deepgram API key");
        case 402:
          throw new Error("Insufficient credits in Deepgram account");
        case 403:
          throw new Error("No access to requested Deepgram model");
        case 429:
          throw new Error("Too many requests to Deepgram. Please try again later");
        case 503:
          throw new Error("Deepgram service temporarily unavailable");
        default:
          throw new Error(`Deepgram API error: ${response.status} - ${errorData.err_msg || 'Unknown error'}`);
      }
    }

    let result;
    try {
      result = await response.json();
      console.log('Successfully parsed Deepgram response');
    } catch (e) {
      console.error('Failed to parse Deepgram response:', e);
      throw new Error('Invalid response from Deepgram');
    }

    if (!result.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response structure from Deepgram:', result);
      throw new Error('Invalid response structure from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    console.log('Successfully processed audio. Transcript length:', transcript.length);

    return new Response(
      JSON.stringify({ transcript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
