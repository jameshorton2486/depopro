
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
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse and validate request body
    const requestData: TranscribeRequest = await req.json();
    
    if (!requestData.audioData) {
      throw new Error('Missing audio data');
    }

    if (!requestData.options) {
      throw new Error('Missing transcription options');
    }

    // Decode base64 audio data
    const binaryData = Uint8Array.from(atob(requestData.audioData), c => c.charCodeAt(0));

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
        'Content-Type': 'application/octet-stream',
      },
      body: binaryData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Deepgram API error:', error);
      throw new Error(`Deepgram API error: ${error}`);
    }

    const result = await response.json();
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript;

    if (!transcript) {
      throw new Error('No transcript received from Deepgram');
    }

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
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error'
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
