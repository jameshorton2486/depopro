
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function validateRequestBody(body: any) {
  if (!body) {
    throw new Error('Request body is empty');
  }

  if (!body.audio || !Array.isArray(body.audio)) {
    throw new Error('Invalid audio data format. Expected array of numbers.');
  }

  if (!body.mime_type) {
    throw new Error('Missing mime_type in request');
  }

  const supportedMimeTypes = [
    'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ];

  if (!supportedMimeTypes.includes(body.mime_type)) {
    throw new Error(`Unsupported mime type: ${body.mime_type}`);
  }

  return true;
}

serve(async (req) => {
  console.log("Processing request:", req.method, req.url);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  // Ensure POST method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Only POST method is allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Validate Deepgram API key
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      console.error('DEEPGRAM_API_KEY not found');
      throw new Error('Server configuration error: Missing API key');
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      throw new Error('Invalid JSON in request body');
    }

    // Validate request body
    try {
      validateRequestBody(body);
    } catch (error) {
      console.error('Request validation failed:', error);
      throw error;
    }

    const { audio, mime_type, options } = body;

    // Initialize Deepgram
    console.log('Initializing Deepgram with options:', {
      mimeType: mime_type,
      audioLength: audio.length,
      options: JSON.stringify(options)
    });

    const deepgram = new Deepgram(deepgramKey);

    // Prepare audio data
    const audioData = new Uint8Array(audio);
    if (audioData.length === 0) {
      throw new Error('Empty audio data');
    }

    // Process with Deepgram
    const source = {
      buffer: audioData,
      mimetype: mime_type,
    };

    const transcriptionOptions = {
      ...options,
      smart_format: true,
      punctuate: true,
      utterances: true,
      numerals: true,
      language: options.language || 'en',
      model: options.model || 'nova-2',
    };

    console.log('Sending request to Deepgram');
    const response = await deepgram.transcription.preRecorded(source, transcriptionOptions);

    // Validate Deepgram response
    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid Deepgram response structure:', response);
      throw new Error('Invalid response from Deepgram API');
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
    console.error('Error processing request:', error);
    
    // Determine appropriate status code
    let status = 500;
    if (error.message.includes('Invalid JSON') || 
        error.message.includes('Missing') || 
        error.message.includes('Invalid audio')) {
      status = 400;
    }

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
