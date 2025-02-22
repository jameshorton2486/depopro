
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    console.log("✅ Processing transcription request");

    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const optionsStr = formData.get("options");

    if (!audioFile) {
      console.error("❌ No audio file provided");
      return new Response(
        JSON.stringify({ error: "No audio file provided" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let options;
    try {
      options = optionsStr ? JSON.parse(optionsStr as string) : {};
      console.log("✅ Parsed options:", options);
    } catch (error) {
      console.error("❌ Error parsing options:", error);
      options = {};
    }

    const deepgramApiKey = Deno.env.get("DEEPGRAM_API_KEY");
    if (!deepgramApiKey) {
      console.error("❌ Deepgram API Key not found");
      return new Response(
        JSON.stringify({ error: "Deepgram API key missing" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new FormData for Deepgram with the file
    const deepgramForm = new FormData();
    deepgramForm.append("audio", audioFile);

    // Construct Deepgram API URL with query parameters
    const queryParams = new URLSearchParams({
      model: options.model || "nova-2",
      language: options.language || "en",
      smart_format: (options.smart_format ?? true).toString(),
      diarize: (options.diarize ?? true).toString(),
      punctuate: (options.punctuate ?? true).toString(),
      filler_words: (options.filler_words ?? true).toString(),
      paragraphs: (options.paragraphs ?? true).toString(),
    });

    console.log("✅ Sending request to Deepgram with options:", Object.fromEntries(queryParams));

    const response = await fetch(`https://api.deepgram.com/v1/listen?${queryParams}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramApiKey}`,
      },
      body: deepgramForm,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Deepgram API error:", error);
      return new Response(
        JSON.stringify({ error: "Deepgram API error", details: error }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("✅ Transcription successful");

    return new Response(
      JSON.stringify(data), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
