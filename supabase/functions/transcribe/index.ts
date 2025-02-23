
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscribeRequest {
  audioData: string;
  fileName: string;
  options: {
    model: string;
    language: string;
    smart_format: boolean;
    diarize: boolean;
    punctuate: boolean;
    filler_words: boolean;
    paragraphs: boolean;
    keyterms?: Array<{ term: string; boost: number; category: string; }>;
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Deepgram API key
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      console.error('Missing Deepgram API key');
      throw new Error('Deepgram API key not configured');
    }

    // Parse and validate request body
    let requestData: TranscribeRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      throw new Error('Invalid request format');
    }

    // Validate required fields
    if (!requestData.audioData) {
      throw new Error('Missing audio data');
    }

    if (!requestData.options) {
      throw new Error('Missing transcription options');
    }

    console.log('Processing audio file:', {
      fileName: requestData.fileName,
      options: {
        ...requestData.options,
        // Don't log the actual audio data
        audioData: '[REDACTED]'
      }
    });

    // Decode base64 audio data
    let binaryData: Uint8Array;
    try {
      binaryData = Uint8Array.from(atob(requestData.audioData), c => c.charCodeAt(0));
      console.log('Successfully decoded audio data, size:', binaryData.length);
    } catch (error) {
      console.error('Failed to decode base64 audio data:', error);
      throw new Error('Invalid audio data format');
    }

    // Prepare Deepgram request
    const deepgramUrl = 'https://api.deepgram.com/v1/listen';
    const deepgramOptions = {
      ...requestData.options,
      model: requestData.options.model || 'nova-2',
      language: requestData.options.language || 'en-US',
      smart_format: true,
      diarize: requestData.options.diarize ?? true
    };

    console.log('Calling Deepgram API with options:', deepgramOptions);

    // Call Deepgram API
    const response = await fetch(deepgramUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response format from Deepgram:', result);
      throw new Error('Invalid response format from Deepgram');
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;

    if (!transcript) {
      console.error('No transcript in Deepgram response:', result);
      throw new Error('No transcript received from Deepgram');
    }

    console.log('Successfully generated transcript:', {
      length: transcript.length,
      preview: transcript.substring(0, 100) + '...'
    });

    return new Response(
      JSON.stringify({ 
        transcript,
        status: 'success'
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Return a more detailed error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400, // Use standard HTTP status code instead of custom code
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
