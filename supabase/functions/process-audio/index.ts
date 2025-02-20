
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    console.log("Starting audio processing...");
    
    // Log API key presence (safely)
    const deepgramKey = Deno.env.get('DEEPGRAM_API_KEY');
    console.log("Deepgram API Key status:", deepgramKey ? "Present" : "Missing");
    
    if (!deepgramKey) {
      throw new Error('Deepgram API key not configured');
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed successfully");
    } catch (error) {
      console.error("Error parsing request body:", error);
      throw new Error(`Invalid request body: ${error.message}`);
    }

    const { audio, mime_type, options } = body;

    // Validate inputs
    if (!audio) {
      throw new Error('Audio data is required');
    }
    if (!mime_type) {
      throw new Error('MIME type is required');
    }
    console.log("Input validation passed");

    // Initialize Deepgram
    console.log("Initializing Deepgram client...");
    const deepgram = new Deepgram(deepgramKey);

    // Process audio data
    console.log("Processing audio data...");
    let audioData;
    try {
      audioData = new Uint8Array(audio);
      console.log("Audio data processed, size:", audioData.length, "bytes");
    } catch (error) {
      console.error("Error processing audio data:", error);
      throw new Error(`Failed to process audio data: ${error.message}`);
    }

    const source = {
      buffer: audioData,
      mimetype: mime_type,
    };

    // Prepare Deepgram options
    const deepgramOptions = {
      model: options?.model || "nova-3",
      language: options?.language || "en-US",
      smart_format: options?.smart_format ?? true,
      punctuate: options?.punctuate ?? true,
      diarize: options?.diarize ?? true,
      diarize_version: options?.diarize ? "3" : undefined,
      filler_words: options?.filler_words ?? true,
      detect_language: options?.detect_language ?? true
    };
    console.log("Using Deepgram options:", JSON.stringify(deepgramOptions));

    // Make Deepgram API request
    console.log("Sending request to Deepgram...");
    let response;
    try {
      response = await deepgram.transcription.preRecorded(source, deepgramOptions);
      console.log("Received response from Deepgram");
    } catch (error) {
      console.error("Deepgram API error:", error);
      throw new Error(`Deepgram API error: ${JSON.stringify(error)}`);
    }

    // Validate Deepgram response
    if (!response?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error("Invalid Deepgram response structure:", response);
      throw new Error('Invalid response structure from Deepgram API');
    }

    const result = response.results.channels[0].alternatives[0];
    console.log("Successfully processed transcript with confidence:", result.confidence);

    return new Response(
      JSON.stringify({
        transcript: result.transcript,
        metadata: response.metadata,
        words: result.words,
        confidence: result.confidence
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error("Full error details:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
