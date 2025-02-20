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

    const { audio, mime_type } = requestData;

    if (!audio || !Array.isArray(audio)) {
      throw new Error('Invalid or missing audio data');
    }

    const audioData = new Uint8Array(audio);
    console.log(`Reconstructed audio data, size: ${audioData.length} bytes`);

    // Enhanced query parameters optimized for diarization and formatting
    const queryParams = new URLSearchParams({
      model: "nova-2",
      language: "en-US",
      smart_format: "true",
      punctuate: "true",
      diarize: "true",
      utterances: "true",
      filler_words: "true",
      detect_language: "true",
      utt_split: "1.5",
      tier: "enhanced" // Add enhanced tier for better formatting
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
    
    // Enhanced speaker diarization with word-level processing
    let utterances = [];
    let currentUtterance = null;

    // Enhanced text formatting function
    const formatText = (text: string): string => {
      return text
        .trim()
        // Fix spacing after punctuation
        .replace(/([.!?;,])\s*/g, '$1 ')
        // Ensure proper capitalization after sentence endings
        .replace(/([.!?])\s+([a-z])/g, (_, p1, p2) => `${p1} ${p2.toUpperCase()}`)
        // Fix multiple spaces
        .replace(/\s+/g, ' ')
        // Ensure first letter is capitalized
        .replace(/^[a-z]/, letter => letter.toUpperCase())
        // Add proper spacing for parenthetical statements
        .replace(/\s*\(\s*/g, ' (')
        .replace(/\s*\)\s*/g, ') ')
        // Fix "I" pronoun
        .replace(/\si\s/g, ' I ')
        // Fix common contractions
        .replace(/\sim\s/g, ' I\'m ')
        .replace(/\sill\s/g, ' I\'ll ')
        .replace(/\sisnt\s/g, ' isn\'t ')
        .replace(/\sdont\s/g, ' don\'t ')
        // Add paragraph breaks after sentences
        .replace(/([.!?])\s+(?=[A-Z])/g, '$1\n\n');
    };

    if (alternative.words) {
      alternative.words.forEach((word: any) => {
        if (!currentUtterance || currentUtterance.speaker !== `Speaker ${word.speaker}`) {
          if (currentUtterance) {
            currentUtterance.text = formatText(currentUtterance.text);
            utterances.push(currentUtterance);
          }
          currentUtterance = {
            speaker: `Speaker ${word.speaker}`,
            text: word.word,
            start: word.start,
            end: word.end,
            confidence: word.confidence,
            words: [word],
            fillerWords: word.type === 'filler' ? [word] : []
          };
        } else {
          currentUtterance.text += ` ${word.word}`;
          currentUtterance.end = word.end;
          currentUtterance.words.push(word);
          if (word.type === 'filler') {
            currentUtterance.fillerWords.push(word);
          }
        }
      });

      if (currentUtterance) {
        currentUtterance.text = formatText(currentUtterance.text);
        utterances.push(currentUtterance);
      }
    }

    // Clean and format utterances
    utterances = utterances.map(utterance => ({
      ...utterance,
      text: utterance.text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/([.!?])\s*(?=[A-Z])/g, '$1\n\n')
    }));

    // Format transcript with enhanced spacing and formatting
    const formattedTranscript = utterances
      .map(u => `${u.speaker}:\n\n${u.text}\n`)
      .join('\n');

    console.log('Successfully processed audio:', {
      transcriptLength: formattedTranscript.length,
      utteranceCount: utterances.length,
      hasWords: utterances.some(u => u.words.length > 0),
      hasFillerWords: utterances.some(u => u.fillerWords.length > 0),
      diarizationEnabled: true,
      speakersDetected: new Set(utterances.map(u => u.speaker)).size
    });

    return new Response(
      JSON.stringify({ 
        transcript: formattedTranscript,
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
