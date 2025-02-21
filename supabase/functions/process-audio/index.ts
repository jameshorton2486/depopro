
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    // Validate environment
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('DEEPGRAM_API_KEY is not configured in environment variables');
    }

    // Log request method and headers for debugging
    console.log('Request details:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid JSON in request body');
    }

    const { audio, mime_type, options } = body;

    // Validate required fields
    if (!audio) {
      throw new Error('Missing audio data in request');
    }
    if (!Array.isArray(audio)) {
      throw new Error('Audio data must be an array');
    }
    if (!mime_type) {
      throw new Error('Missing mime_type in request');
    }

    console.log('Processing request with:', {
      mimeType: mime_type,
      audioLength: audio.length,
      options: JSON.stringify(options, null, 2)
    });

    // Test Deepgram API connectivity
    const deepgram = new Deepgram(deepgramKey);
    
    try {
      // First test the API key with a simple projects request
      const testResponse = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          'Authorization': `Token ${deepgramKey}`,
        }
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('Deepgram API test failed:', {
          status: testResponse.status,
          statusText: testResponse.statusText,
          error: errorText
        });
        throw new Error(`Deepgram API test failed: ${testResponse.status} - ${errorText}`);
      }

      console.log('Deepgram API test successful');
    } catch (error) {
      console.error('Failed to test Deepgram API:', error);
      throw new Error(`Deepgram API connectivity test failed: ${error.message}`);
    }

    // Prepare transcription request
    const source = {
      buffer: new Uint8Array(audio),
      mimetype: mime_type,
    };

    // Set up transcription options
    const transcriptionOptions = {
      ...options,
      smart_format: true,
      punctuate: true,
      utterances: true,
      numerals: true,
    };

    console.log('Sending request to Deepgram with options:', transcriptionOptions);

    // Send request to Deepgram with timeout
    const timeoutMs = 30000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    );

    const transcriptionPromise = deepgram.transcription.preRecorded(source, transcriptionOptions);
    
    const response = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid Deepgram response:', response);
      throw new Error('Invalid response structure from Deepgram');
    }

    const transcript = response.results.channels[0].alternatives[0].transcript;
    
    console.log('Transcription successful:', {
      transcriptLength: transcript.length,
      wordCount: transcript.split(' ').length
    });

    return new Response(
      JSON.stringify({
        transcript,
        metadata: {
          ...response.metadata,
          processingTime: Date.now()
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    // Ensure we have a proper error message
    const errorMessage = error?.message || 'An unknown error occurred';
    const errorStack = error?.stack || new Error().stack;
    
    console.error('Error in process-audio function:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    // Determine appropriate status code
    const statusCode = 
      errorMessage.includes('API key') ? 401 :
      errorMessage.includes('timeout') ? 408 :
      errorMessage.includes('Invalid') ? 400 :
      500;

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorStack,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
