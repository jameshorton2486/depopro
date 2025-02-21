
// @deno-types="https://raw.githubusercontent.com/deepgram/deepgram-node-sdk/main/dist/index.d.ts"
import { Deepgram } from "https://esm.sh/@deepgram/sdk@1.3.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  console.debug("Request received:", {
    method: req.method,
    contentType: req.headers.get("content-type"),
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Parse request body
    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Content-Type must be application/json");
    }

    const body = await req.json();
    console.debug("Request body:", {
      hasAudio: !!body.audio,
      mimeType: body.mime_type,
      options: body.options
    });

    // Validate request payload
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

    // Get and validate API key
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramKey) {
      throw new Error('Deepgram API key not configured');
    }

    // Initialize Deepgram
    const deepgram = new Deepgram(deepgramKey);

    // Prepare audio data
    const audioData = new Uint8Array(body.audio);
    if (audioData.length === 0) {
      throw new Error('Empty audio data');
    }

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

    console.debug("Sending request to Deepgram:", { 
      audioSize: audioData.length,
      options: transcriptionOptions 
    });

    // Process with Deepgram
    const response = await deepgram.transcription.preRecorded(source, transcriptionOptions);

    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error("Invalid Deepgram response:", response);
      throw new Error('Invalid response from Deepgram');
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Processing error:", error);

    const status = error.message.includes('Invalid') || 
                  error.message.includes('Missing') ? 400 : 500;

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
