
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
      console.error("ERROR: DEEPGRAM_API_KEY is not set in environment variables");
      throw new Error('DEEPGRAM_API_KEY is not set in environment variables');
    }

    console.log("Deepgram API Key is configured (first 4 chars):", deepgramApiKey.substring(0, 4) + "...");
    
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
      try {
        result = await deepgram.listen.prerecorded.transcribeUrl(
          { url: audioUrl },
          deepgramOptions
        );
        console.log("YouTube transcription completed successfully");
      } catch (error) {
        console.error("YouTube transcription error:", error.message);
        throw error;
      }
    } 
    // Handle direct audio URL
    else if (audioUrl) {
      console.log("Processing audio URL:", audioUrl);
      try {
        result = await deepgram.listen.prerecorded.transcribeUrl(
          { url: audioUrl },
          deepgramOptions
        );
        console.log("URL transcription completed successfully");
      } catch (error) {
        console.error("URL transcription error:", error.message);
        throw error;
      }
    } 
    // Handle Base64 audio data
    else if (audioData) {
      console.log("Processing audio data from base64");
      try {
        // Extract the actual base64 data from the data URL
        const base64Data = audioData.split(",")[1];
        console.log("Base64 data length:", base64Data.length);
        
        const binaryData = atob(base64Data);
        console.log("Binary data length:", binaryData.length);
        
        const bytes = new Uint8Array(binaryData.length);
        
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        console.log("Audio bytes length:", bytes.length);
        console.log("Starting file transcription...");
        
        result = await deepgram.listen.prerecorded.transcribeFile(
          bytes,
          deepgramOptions
        );
        
        console.log("File transcription completed successfully");
      } catch (error) {
        console.error("File transcription error:", error.message);
        if (error.stack) {
          console.error("Error stack:", error.stack);
        }
        throw error;
      }
    } else {
      throw new Error("No audio data or URL provided");
    }

    // Log the structure of the result to help with debugging
    console.log("Transcription result structure:", 
      JSON.stringify({
        hasResults: !!result.results,
        hasChannels: result.results ? !!result.results.channels : false,
        channelsLength: result.results && result.results.channels ? result.results.channels.length : 0,
        hasAlternatives: result.results && result.results.channels && result.results.channels[0] 
          ? !!result.results.channels[0].alternatives : false,
        alternativesLength: result.results && result.results.channels && result.results.channels[0] && result.results.channels[0].alternatives
          ? result.results.channels[0].alternatives.length : 0,
        hasTranscript: result.results && result.results.channels && result.results.channels[0] && result.results.channels[0].alternatives 
          ? !!result.results.channels[0].alternatives[0].transcript : false,
        transcriptLength: result.results && result.results.channels && result.results.channels[0] && result.results.channels[0].alternatives && result.results.channels[0].alternatives[0].transcript
          ? result.results.channels[0].alternatives[0].transcript.length : 0,
        hasParagraphs: result.results && result.results.channels && result.results.channels[0] && result.results.channels[0].alternatives 
          ? !!result.results.channels[0].alternatives[0].paragraphs : false,
      })
    );
    
    // Check for a valid result with transcript data
    if (!result.results || !result.results.channels || result.results.channels.length === 0 || 
        !result.results.channels[0].alternatives || result.results.channels[0].alternatives.length === 0) {
      console.error("Invalid transcription result structure:", JSON.stringify(result));
      throw new Error("Received invalid transcription result structure from Deepgram");
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Transcription error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
