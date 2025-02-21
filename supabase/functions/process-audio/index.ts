
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log("Function started:", req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders
    });
  }

  try {
    console.log('Starting process-audio function');

    // Validate environment
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      console.error('DEEPGRAM_API_KEY not found in environment variables');
      throw new Error('DEEPGRAM_API_KEY is not configured');
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
      console.log('Received request body:', {
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

    // Initialize Deepgram client
    console.log('Initializing Deepgram client...');
    const deepgram = new Deepgram(deepgramKey);

    // Process the audio
    console.log('Processing audio with Deepgram...');
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

    console.log('Sending request to Deepgram with options:', transcriptionOptions);
    const response = await deepgram.transcription.preRecorded(source, transcriptionOptions);
    
    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response structure from Deepgram:', response);
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
    console.error('Error in process-audio function:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { 
        status: error.status || 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
