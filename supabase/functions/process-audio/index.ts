
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

    const { audio, mime_type, options } = await req.json();
    console.log('Processing request with options:', options);
    
    if (!audio || !mime_type) {
      throw new Error('Missing required audio data or mime type');
    }

    // Convert audio data to Uint8Array
    const audioData = new Uint8Array(audio);

    // Configure Deepgram API parameters
    const params = new URLSearchParams({
      model: options?.model || 'nova-3',
      language: options?.language || 'en-US',
      smart_format: 'true',
      punctuate: 'true',
      diarize: 'true',
      diarize_version: '3',
      utterances: 'true',
      filler_words: options?.filler_words ? 'true' : 'false'
    });

    console.log('Making request to Deepgram with params:', Object.fromEntries(params.entries()));

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${params.toString()}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': mime_type
        },
        body: audioData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', {
        status: response.status,
        text: errorText
      });
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Deepgram:', {
      hasResults: !!data.results,
      hasUtterances: !!data.results?.utterances,
      channels: data.results?.channels?.length
    });
    
    if (!data.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response from Deepgram');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store raw JSON response in storage
    const fileName = `transcript-${Date.now()}.json`;
    const { error: uploadError } = await supabase.storage
      .from('transcriptions')
      .upload(fileName, JSON.stringify(data, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading JSON:', uploadError);
      throw new Error('Failed to store transcription data');
    }

    // Store metadata in database
    const { error: dbError } = await supabase
      .from('transcription_data')
      .insert({
        file_name: fileName,
        file_path: fileName,
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model
        },
        raw_response: data
      });

    if (dbError) {
      console.error('Error storing metadata:', dbError);
      throw new Error('Failed to store transcription metadata');
    }

    const transcript = data.results.channels[0].alternatives[0];
    const words = transcript.words || [];
    
    // Process words into speaker-based utterances
    let utterances = [];
    let currentUtterance = null;

    words.forEach((word: any) => {
      const speaker = `Speaker ${word.speaker || 0}`;
      
      if (!currentUtterance || currentUtterance.speaker !== speaker) {
        if (currentUtterance) {
          utterances.push(currentUtterance);
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
      utterances.push(currentUtterance);
    }

    // Format utterances
    utterances = utterances.map(utterance => ({
      ...utterance,
      text: utterance.text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/([.!?])\s*(?=[A-Z])/g, '$1\n')
    }));

    // Format transcript with proper speaker labeling and spacing
    const formattedTranscript = utterances
      .map(u => `${u.speaker}:\n\n${u.text}\n`)
      .join('\n');

    console.log('Processing complete:', {
      utteranceCount: utterances.length,
      speakerCount: new Set(utterances.map(u => u.speaker)).size,
      transcriptLength: formattedTranscript.length,
      storedFileName: fileName
    });

    return new Response(
      JSON.stringify({
        transcript: formattedTranscript,
        utterances,
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model,
          speakerCount: new Set(utterances.map(u => u.speaker)).size
        },
        storedFileName: fileName
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
      JSON.stringify({ error: error.message }),
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
