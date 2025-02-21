
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.debug('Starting process-audio function');

    // Validate environment
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.debug('Received request body:', {
        hasAudio: !!body.audio,
        mimeType: body.mime_type,
        hasOptions: !!body.options
      });
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid JSON in request body');
    }

    const { audio, mime_type, options } = body;

    // Validate required fields
    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid or missing audio data');
    }
    if (!mime_type) {
      throw new Error('Missing mime_type');
    }

    // Test Deepgram API connectivity
    const deepgram = new Deepgram(deepgramKey);
    
    try {
      console.debug('Testing Deepgram API connectivity...');
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

      console.debug('Deepgram API test successful');
    } catch (error) {
      console.error('Failed to test Deepgram API:', error);
      throw new Error(`Deepgram API connectivity test failed: ${error.message}`);
    }

    // Prepare transcription request
    console.debug('Preparing transcription request with options:', options);
    
    const source = {
      buffer: new Uint8Array(audio),
      mimetype: mime_type,
    };

    const transcriptionOptions = {
      ...options,
      smart_format: true,
      punctuate: true,
      utterances: true,
      numerals: true,
    };

    // Send request to Deepgram with timeout
    const timeoutMs = 30000;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
    );

    console.debug('Sending request to Deepgram...');
    const transcriptionPromise = deepgram.transcription.preRecorded(source, transcriptionOptions);
    
    const response = await Promise.race([transcriptionPromise, timeoutPromise]);
    
    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid Deepgram response:', response);
      throw new Error('Invalid response structure from Deepgram');
    }

    const transcript = response.results.channels[0].alternatives[0].transcript;
    
    console.debug('Transcription successful:', {
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

