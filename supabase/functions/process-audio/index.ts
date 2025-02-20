
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

    // Ensure diarize is a string "true" or "false"
    const queryParams = new URLSearchParams({
      model: model || 'nova-3',
      language: language || 'en',
      smart_format: String(options?.smart_format ?? true),
      punctuate: String(options?.punctuate ?? true),
      diarize: String(options?.diarize ?? true), // Explicitly ensure boolean conversion
      utterances: String(options?.utterances ?? true),
      filler_words: String(options?.filler_words ?? true),
      detect_language: String(options?.detect_language ?? true)
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
    console.log('Deepgram raw response:', JSON.stringify(result, null, 2));
    
    if (!result.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid response structure:', result);
      throw new Error('Invalid response structure from Deepgram');
    }

    const alternative = result.results.channels[0].alternatives[0];
    
    // Handle diarized utterances
    let utterances = [];
    if (options?.diarize && alternative.utterances) {
      utterances = alternative.utterances.map((utterance: any) => ({
        speaker: `Speaker ${utterance.speaker || 'Unknown'}`,
        text: utterance.text,
        start: utterance.start,
        end: utterance.end,
        confidence: utterance.confidence,
        words: utterance.words || [],
        fillerWords: (utterance.words || []).filter((word: any) => word.type === 'filler')
      }));
    } else if (alternative.words && alternative.words.length > 0) {
      // If not diarized but we have words, create a single utterance
      utterances = [{
        speaker: 'Speaker',
        text: alternative.transcript,
        start: alternative.words[0].start,
        end: alternative.words[alternative.words.length - 1].end,
        confidence: alternative.confidence,
        words: alternative.words,
        fillerWords: alternative.words.filter((word: any) => word.type === 'filler')
      }];
    }

    console.log('Successfully processed audio:', {
      transcriptLength: alternative.transcript.length,
      utteranceCount: utterances.length,
      hasWords: utterances.some(u => u.words.length > 0),
      hasFillerWords: utterances.some(u => u.fillerWords.length > 0),
      diarizationEnabled: options?.diarize,
      speakersDetected: new Set(utterances.map(u => u.speaker)).size
    });

    return new Response(
      JSON.stringify({ 
        transcript: alternative.transcript,
        utterances,
        metadata: {
          duration: result.metadata?.duration,
          channels: result.metadata?.channels,
          model: result.metadata?.model,
          language: result.metadata?.language,
          speakerCount: new Set(utterances.map(u => u.speaker)).size
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
