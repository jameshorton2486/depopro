
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting audio processing...');

    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      console.error('Deepgram API key is missing');
      throw new Error('API key configuration error');
    }

    const requestData = await req.json();
    console.log('Received request data:', {
      hasAudio: !!requestData.audio,
      audioLength: requestData.audio?.length,
      mimeType: requestData.mime_type,
      model: requestData.model,
      language: requestData.language
    });

    const { audio, model, language, mime_type } = requestData;

    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid or missing audio data');
    }

    const audioData = new Uint8Array(audio);
    console.log(`Reconstructed audio data, size: ${audioData.length} bytes`);

    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: 'true',
      punctuate: 'true',
      paragraphs: 'true',
      filler_words: 'true',
      diarize: 'true',
      utterances: 'true'
    });

    console.log('Making request to Deepgram with params:', Object.fromEntries(queryParams.entries()));
    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mime_type,
        },
        body: audioData,
      }
    );

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
      console.error('Invalid response structure:', result);
      throw new Error('Invalid response structure from Deepgram');
    }

    const alternative = result.results.channels[0].alternatives[0];
    const paragraphs = alternative.paragraphs?.paragraphs || [];
    
    // Process paragraphs with speaker information
    const formattedTranscript = paragraphs.map((para: any) => ({
      speaker: para.speaker || 'Unknown Speaker',
      text: para.text,
      start: para.start,
      end: para.end
    }));

    console.log('Successfully processed audio with speaker diarization');

    return new Response(
      JSON.stringify({ 
        transcript: alternative.transcript,
        paragraphs: formattedTranscript 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
