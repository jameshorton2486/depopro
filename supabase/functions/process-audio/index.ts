
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function processAudio(audioData: number[], mimeType: string, options: any) {
  try {
    // Convert number array back to Uint8Array
    const audioBuffer = new Uint8Array(audioData);

    // Prepare the request URL and headers
    const url = 'https://api.deepgram.com/v1/listen';
    const headers = {
      'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
      'Content-Type': mimeType
    };

    // Prepare query parameters based on options
    const queryParams = new URLSearchParams({
      model: options.model || 'nova-2',
      language: options.language || 'en',
      smart_format: 'true',
      punctuate: (options.punctuate !== false).toString()
    });

    if (options.diarize) {
      queryParams.append('diarize', 'true');
      queryParams.append('diarize_version', '3');
    }

    console.log("🎯 Sending to Deepgram API:", {
      url,
      mimeType,
      options,
      bufferSize: audioBuffer.length
    });

    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'POST',
      headers,
      body: audioBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Deepgram API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Received response from Deepgram");

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error("Invalid response format from Deepgram");
    }

    return {
      transcript: result.results.channels[0].alternatives[0].transcript,
      metadata: {
        duration: result.metadata?.duration,
        channels: result.metadata?.channels,
        model: result.metadata?.model,
        processed_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("❌ Error processing audio:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, mime_type, options } = await req.json();

    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid audio data: must be an array of numbers');
    }

    if (!mime_type || typeof mime_type !== 'string') {
      throw new Error('Invalid mime_type: must be a string');
    }

    // Process the audio data
    const result = await processAudio(audio, mime_type, options || {});

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Server error:', {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
