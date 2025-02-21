
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Restrict to specific origin for security
const ALLOWED_ORIGIN = "https://id-preview--e06a7542-46ca-48ef-ba79-945bafa5cafa.lovable.app";

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Log incoming request details
  console.debug("Request received:", {
    method: req.method,
    origin: req.headers.get("origin"),
    contentType: req.headers.get("content-type"),
  });

  // Validate origin
  const origin = req.headers.get("origin");
  if (origin !== ALLOWED_ORIGIN) {
    console.warn("Invalid origin:", origin);
    return new Response(JSON.stringify({ error: "Invalid origin" }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  // Ensure POST method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Validate content type
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Content-Type must be application/json");
    }

    // Parse and validate request body
    const body = await req.json();
    
    console.debug("Request payload:", {
      hasAudio: !!body.audio,
      mimeType: body.mime_type,
      options: body.options
    });

    if (!body.audio || !Array.isArray(body.audio)) {
      throw new Error("Invalid audio data format");
    }

    if (!body.mime_type) {
      throw new Error("Missing mime_type");
    }

    const supportedMimeTypes = [
      'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (!supportedMimeTypes.includes(body.mime_type)) {
      throw new Error(`Unsupported mime type: ${body.mime_type}`);
    }

    // Validate API key
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      console.error("DEEPGRAM_API_KEY not found in environment");
      throw new Error('Server configuration error: Missing API key');
    }

    // Initialize Deepgram client
    const deepgram = new Deepgram(deepgramKey);

    // Prepare audio data
    const audioData = new Uint8Array(body.audio);
    if (audioData.length === 0) {
      throw new Error('Empty audio data');
    }

    // Create source object
    const source = {
      buffer: audioData,
      mimetype: body.mime_type,
    };

    // Prepare transcription options
    const transcriptionOptions = {
      smart_format: true,
      punctuate: true,
      utterances: true,
      numerals: true,
      model: body.options?.model || 'nova-2',
      language: body.options?.language || 'en',
      diarize: body.options?.diarize || false,
      diarize_version: body.options?.diarize ? "3" : undefined,
    };

    console.debug("Calling Deepgram API with:", {
      audioSize: audioData.length,
      options: transcriptionOptions
    });

    // Process with Deepgram
    const response = await deepgram.transcription.preRecorded(source, transcriptionOptions);

    // Validate Deepgram response
    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error("Invalid Deepgram response structure:", response);
      throw new Error('Invalid response from Deepgram API');
    }

    const result = {
      transcript: response.results.channels[0].alternatives[0].transcript,
      metadata: {
        duration: response.metadata?.duration,
        channels: response.metadata?.channels,
        model: response.metadata?.model,
        processed_at: new Date().toISOString()
      }
    };

    console.debug("Transcription successful:", {
      transcriptLength: result.transcript.length,
      duration: result.metadata.duration
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error processing request:", error);

    // Determine appropriate status code
    let status = 500;
    if (error.message.includes('Invalid') || 
        error.message.includes('Missing') || 
        error.message.includes('Unsupported')) {
      status = 400;
    }

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
