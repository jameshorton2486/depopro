
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate audio data format and structure
function validateAudioData(audio: unknown): boolean {
  if (!audio || !Array.isArray(audio)) return false;
  // Check if array contains valid numbers
  return audio.every(num => typeof num === 'number' && num >= 0 && num <= 255);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log raw request details
    console.log('🔍 Incoming request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      timestamp: new Date().toISOString()
    });

    const body = await req.json();
    console.log('📦 Raw request body:', {
      keys: Object.keys(body),
      hasAudio: !!body.audio,
      mimeType: body.mime_type,
      timestamp: new Date().toISOString()
    });

    const { audio, mime_type, options } = body;

    // Detailed audio data validation
    console.log('🎵 Audio data analysis:', {
      audioPresent: !!audio,
      audioType: typeof audio,
      isArray: Array.isArray(audio),
      arrayLength: Array.isArray(audio) ? audio.length : 0,
      sampleValues: Array.isArray(audio) ? audio.slice(0, 5) : [],
      mimeType: mime_type,
      timestamp: new Date().toISOString()
    });

    if (!validateAudioData(audio)) {
      console.error('❌ Invalid audio data format:', {
        audioPresent: !!audio,
        audioType: typeof audio,
        isArray: Array.isArray(audio),
        validNumbers: Array.isArray(audio) ? audio.slice(0, 5).every(num => typeof num === 'number') : false,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid audio data format: must be an array of numbers (0-255)');
    }

    if (!mime_type || typeof mime_type !== 'string') {
      console.error('❌ Invalid mime_type:', {
        mimeTypePresent: !!mime_type,
        mimeTypeValue: mime_type,
        type: typeof mime_type
      });
      throw new Error('Invalid mime_type: must be a string');
    }

    // Convert validated number array to Uint8Array
    const audioBuffer = new Uint8Array(audio);
    
    console.log('🔄 Audio buffer created:', {
      originalLength: audio.length,
      bufferLength: audioBuffer.length,
      bufferSample: Array.from(audioBuffer.slice(0, 5)),
      timestamp: new Date().toISOString()
    });

    // Prepare request for Deepgram
    const url = 'https://api.deepgram.com/v1/listen';
    const headers = {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': mime_type
    };

    // Configure Deepgram parameters
    const queryParams = new URLSearchParams({
      model: options?.model || 'nova-2',
      language: options?.language || 'en',
      smart_format: 'true',
      punctuate: (options?.punctuate !== false).toString()
    });

    if (options?.diarize) {
      queryParams.append('diarize', 'true');
      if (options.diarize_version) {
        queryParams.append('diarize_version', options.diarize_version);
      }
    }

    const requestUrl = `${url}?${queryParams.toString()}`;
    console.log('📡 Sending request to Deepgram:', {
      url: requestUrl,
      contentLength: audioBuffer.length,
      mimeType: mime_type,
      options: queryParams.toString(),
      timestamp: new Date().toISOString()
    });

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: audioBuffer
    });

    const responseText = await response.text();
    console.log('📥 Deepgram raw response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText.slice(0, 1000) + (responseText.length > 1000 ? '...' : ''),
      timestamp: new Date().toISOString()
    });

    if (!response.ok) {
      console.error('❌ Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: responseText,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.error('❌ Failed to parse Deepgram response:', {
        error: error.message,
        responseText: responseText.slice(0, 1000),
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid JSON response from Deepgram');
    }

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('❌ Invalid response format from Deepgram:', {
        result: JSON.stringify(result, null, 2),
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid response format from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;

    console.log('✅ Successfully processed audio:', {
      transcriptLength: transcript.length,
      sampleText: transcript.slice(0, 100) + (transcript.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        transcript,
        metadata: {
          duration: result.metadata?.duration,
          channels: result.metadata?.channels,
          model: result.metadata?.model,
          processed_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Server error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
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
