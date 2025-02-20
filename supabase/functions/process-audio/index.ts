
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
      throw new Error('Deepgram API key is not configured');
    }

    const requestBody = await req.json();
    const { audio, mime_type, options } = requestBody;
    
    if (!audio || !mime_type) {
      throw new Error('Missing required data');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Convert audio data to Uint8Array
    const audioData = new Uint8Array(audio);

    // Make request to Deepgram
    const response = await fetch('https://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: options?.model || 'nova-3',
      language: options?.language || 'en-US',
      smart_format: 'true',
      punctuate: 'true',
      diarize: 'true',
      diarize_version: '3',
      utterances: 'true',
      filler_words: options?.filler_words ? 'true' : 'false'
    }), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': mime_type
      },
      body: audioData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Deepgram:', {
      hasResults: !!data.results,
      hasUtterances: !!data.results?.utterances,
      channels: data.results?.channels?.length
    });

    // Process utterances and format transcript
    const formatUtterances = (data) => {
      const utterances = data.results?.channels?.[0]?.alternatives?.[0]?.words || [];
      const formattedUtterances = [];
      let currentUtterance = null;

      utterances.forEach((word) => {
        const speaker = `Speaker ${word.speaker || 0}`;
        
        if (!currentUtterance || currentUtterance.speaker !== speaker) {
          if (currentUtterance) {
            formattedUtterances.push(currentUtterance);
          }
          currentUtterance = {
            speaker,
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
          currentUtterance.confidence = (currentUtterance.confidence + word.confidence) / 2;
          currentUtterance.words.push(word);
          if (word.type === 'filler') {
            currentUtterance.fillerWords.push(word);
          }
        }
      });

      if (currentUtterance) {
        formattedUtterances.push(currentUtterance);
      }

      return formattedUtterances;
    };

    const utterances = formatUtterances(data);
    
    // Format the transcript with proper spacing and indentation
    const formattedTranscript = utterances
      .map(u => `\tSpeaker ${u.speaker}:  ${u.text.trim()}`)
      .join('\n\n');

    // Generate base filename
    const baseFileName = `transcript-${Date.now()}`;

    // Store audio file
    const audioFileName = `${baseFileName}.audio${mime_type.includes('wav') ? '.wav' : '.mp3'}`;
    await supabase.storage
      .from('transcriptions')
      .upload(audioFileName, audioData, {
        contentType: mime_type,
        upsert: false
      });

    // Store JSON response
    const jsonFileName = `${baseFileName}.json`;
    await supabase.storage
      .from('transcriptions')
      .upload(jsonFileName, JSON.stringify(data, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    // Store formatted transcript
    const textFileName = `${baseFileName}.txt`;
    await supabase.storage
      .from('transcriptions')
      .upload(textFileName, formattedTranscript, {
        contentType: 'text/plain',
        upsert: false
      });

    return new Response(
      JSON.stringify({
        transcript: formattedTranscript,
        utterances,
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model,
          files: {
            audio: audioFileName,
            json: jsonFileName,
            text: textFileName
          }
        },
        storedFileName: baseFileName
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error processing audio:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString(),
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
