
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
      language: requestData.language,
      options: requestData.options
    });

    const { audio, model, language, mime_type, options } = requestData;

    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid or missing audio data');
    }

    const audioData = new Uint8Array(audio);
    console.log(`Reconstructed audio data, size: ${audioData.length} bytes`);

    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: String(options?.smart_format ?? true),
      punctuate: String(options?.punctuate ?? true),
      paragraphs: String(options?.paragraphs ?? true),
      filler_words: String(options?.filler_words ?? true),
      diarize: String(options?.diarize ?? true),
      utterances: String(options?.utterances ?? true)
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
    const utterances = alternative.utterances || [];
    
    // Process utterances with all available information
    const formattedUtterances = utterances.map((utterance: any) => ({
      speaker: utterance.speaker || 'Unknown Speaker',
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      confidence: utterance.confidence,
      words: utterance.words || [],
      fillerWords: utterance.words?.filter((word: any) => word.type === 'filler') || []
    }));

    console.log('Successfully processed audio:', {
      transcriptLength: alternative.transcript.length,
      utteranceCount: formattedUtterances.length,
      hasWords: formattedUtterances.some(u => u.words.length > 0),
      hasFillerWords: formattedUtterances.some(u => u.fillerWords.length > 0)
    });

    return new Response(
      JSON.stringify({ 
        transcript: alternative.transcript,
        utterances: formattedUtterances,
        metadata: {
          duration: result.metadata?.duration,
          channels: result.metadata?.channels,
          model: result.metadata?.model,
          language: result.metadata?.language
        }
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
