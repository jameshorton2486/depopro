
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Deepgram } from "https://esm.sh/@deepgram/sdk";

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      console.error('Missing Deepgram API key');
      throw new Error('Deepgram API key not configured');
    }

    const deepgram = new Deepgram(apiKey);

    let requestData: TranscribeRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      throw new Error('Invalid request format');
    }

    if (!requestData.audioData || !requestData.options) {
      throw new Error('Missing required data');
    }

    console.log('Processing audio file:', {
      fileName: requestData.fileName,
      options: { ...requestData.options, audioData: '[REDACTED]' }
    });

    let binaryData: Uint8Array;
    try {
      binaryData = Uint8Array.from(atob(requestData.audioData), c => c.charCodeAt(0));
      console.log('Successfully decoded audio data, size:', binaryData.length);
    } catch (error) {
      console.error('Failed to decode base64 audio data:', error);
      throw new Error('Invalid audio data format');
    }

    console.log('Calling Deepgram API with options:', requestData.options);

    const source = {
      buffer: binaryData,
      mimetype: 'audio/wav' // Adjust based on your input format
    };

    const result = await deepgram.transcription.preRecorded(source, {
      ...requestData.options,
      model: requestData.options.model || 'nova-meeting',
      language: requestData.options.language || 'en-US',
      smart_format: true,
      diarize: requestData.options.diarize ?? true,
      paragraphs: true
    });

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response format from Deepgram:', result);
      throw new Error('Invalid response format from Deepgram');
    }

    return new Response(
      JSON.stringify({ 
        data: result,
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
        status: 'error',
        timestamp: new Date().toISOString()
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
