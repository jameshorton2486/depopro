
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting audio processing...');
    
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      throw new Error('Deepgram API key is not configured');
    }

    // Parse request body and validate
    const { audio, mime_type, options } = await req.json();
    
    if (!audio || !mime_type) {
      console.error('Missing required data:', { hasAudio: !!audio, mimeType: mime_type });
      throw new Error('Missing required data: audio or mime_type');
    }

    console.log('Processing audio with options:', {
      model: options?.model,
      language: options?.language,
      mimeType: mime_type,
      audioSize: audio.length
    });

    // Convert audio data to Uint8Array
    const audioData = new Uint8Array(audio);

    // Make request to Deepgram with specific error handling
    const deepgramUrl = 'https://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: options?.model || 'nova-3',
      language: options?.language || 'en-US',
      smart_format: 'true',
      punctuate: 'true',
      diarize: 'true',
      diarize_version: '3',
      utterances: 'true',
      filler_words: options?.filler_words ? 'true' : 'false'
    });

    console.log('Sending request to Deepgram:', { url: deepgramUrl });

    const response = await fetch(deepgramUrl, {
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
    
    if (!data.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid Deepgram response structure:', data);
      throw new Error('Invalid response from Deepgram');
    }

    console.log('Successfully received Deepgram response');

    // Format utterances from words
    const utterances = [];
    const words = data.results.channels[0].alternatives[0].words || [];
    let currentUtterance = null;

    words.forEach((word) => {
      const speaker = `${word.speaker || 0}`;
      
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

    // Format transcript with proper indentation and spacing
    const formattedTranscript = utterances
      .map(u => `\tSpeaker ${u.speaker}:  ${u.text.trim()}`)
      .join('\n\n');

    console.log('Successfully formatted transcript:', {
      utteranceCount: utterances.length,
      transcriptLength: formattedTranscript.length
    });

    // Initialize Supabase client for storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique filename base
    const baseFileName = `transcript-${Date.now()}`;
    const storageBucket = 'transcriptions';

    try {
      // Store audio file
      const audioFileName = `${baseFileName}.audio${mime_type.includes('wav') ? '.wav' : '.mp3'}`;
      await supabase.storage
        .from(storageBucket)
        .upload(audioFileName, audioData, {
          contentType: mime_type,
          upsert: true
        });

      // Store formatted transcript
      const textFileName = `${baseFileName}.txt`;
      await supabase.storage
        .from(storageBucket)
        .upload(textFileName, formattedTranscript, {
          contentType: 'text/plain',
          upsert: true
        });

      console.log('Successfully stored files:', {
        audio: audioFileName,
        text: textFileName
      });

    } catch (storageError) {
      console.error('Storage error:', storageError);
      // Continue execution even if storage fails
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        transcript: formattedTranscript,
        utterances,
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in process-audio function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
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
