
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

    // Format transcript with speaker labels
    const words = data.results.channels[0].alternatives[0].words || [];
    let formattedTranscript = '';
    let currentSpeaker = null;
    let currentText = '';

    words.forEach((word: any) => {
      const speaker = `Speaker ${word.speaker || '1'}`;
      if (speaker !== currentSpeaker) {
        if (currentText) {
          formattedTranscript += `${currentText.trim()}\n\n`;
        }
        formattedTranscript += `${speaker}: `;
        currentSpeaker = speaker;
        currentText = word.word;
      } else {
        currentText += ` ${word.word}`;
      }
    });

    if (currentText) {
      formattedTranscript += `${currentText.trim()}\n\n`;
    }

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
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model
        },
        storedFileName: baseFileName
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
