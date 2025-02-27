
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Deepgram } from "https://esm.sh/@deepgram/sdk@3.11.1";

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
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
    
    if (!deepgramApiKey) {
      throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
    }

    const deepgram = new Deepgram(deepgramApiKey);
    const { audioData, audioUrl, options, isYouTube } = await req.json();

    console.log("Received transcription request with options:", JSON.stringify(options));
    
    let result;
    
    // Initialize the options for Deepgram API
    const deepgramOptions = {
      model: options?.model || 'nova-2',
      language: options?.language || 'en',
      smart_format: options?.smart_format !== false,
      diarize: options?.diarize !== false,
      punctuate: options?.punctuate !== false,
    };

    if (options?.paragraphs !== false) {
      deepgramOptions.paragraphs = true;
    }

    if (options?.utterances) {
      deepgramOptions.utterances = true;
    }

    if (options?.filler_words) {
      deepgramOptions.detect_filler_words = true;
    }

    if (Array.isArray(options?.keywords) && options.keywords.length > 0) {
      deepgramOptions.keywords = options.keywords;
    }

    if (Array.isArray(options?.keyterms) && options.keyterms.length > 0) {
      deepgramOptions.keywords = options.keyterms.map(kt => kt.term);
    }

    console.log("Using Deepgram options:", JSON.stringify(deepgramOptions));

    // Handle YouTube URL
    if (isYouTube && audioUrl) {
      console.log("Processing YouTube URL:", audioUrl);
      result = await deepgram.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        deepgramOptions
      );
    } 
    // Handle direct audio URL
    else if (audioUrl) {
      console.log("Processing audio URL:", audioUrl);
      result = await deepgram.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        deepgramOptions
      );
    } 
    // Handle Base64 audio data
    else if (audioData) {
      console.log("Processing audio data from base64");
      // Extract the actual base64 data from the data URL
      const base64Data = audioData.split(",")[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      result = await deepgram.listen.prerecorded.transcribeFile(
        bytes,
        deepgramOptions
      );
    } else {
      throw new Error("No audio data or URL provided");
    }

    console.log("Transcription completed successfully");
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Transcription error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
