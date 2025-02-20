
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

    // Log request body for debugging
    const requestBody = await req.json();
    console.log('Request body:', {
      hasAudio: !!requestBody.audio,
      mimeType: requestBody.mime_type,
      optionsPresent: !!requestBody.options
    });

    const { audio, mime_type, options } = requestBody;
    console.log('Processing request with options:', options);
    
    if (!audio || !mime_type) {
      throw new Error(`Missing required data. Audio present: ${!!audio}, Mime type: ${!!mime_type}`);
    }

    // Initialize Supabase client early to catch any connection issues
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      throw new Error('Failed to access storage buckets');
    }

    const transcriptionsBucketExists = buckets.some(b => b.name === 'transcriptions');
    if (!transcriptionsBucketExists) {
      console.error('Transcriptions bucket not found');
      throw new Error('Storage bucket not configured');
    }

    // Convert audio data to Uint8Array with error handling
    let audioData;
    try {
      audioData = new Uint8Array(audio);
      console.log('Audio data converted successfully:', {
        length: audioData.length,
        isEmpty: audioData.length === 0
      });
    } catch (error) {
      console.error('Error converting audio data:', error);
      throw new Error('Invalid audio data format');
    }

    // Configure Deepgram API parameters with detailed logging
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
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Received response from Deepgram:', {
      hasResults: !!data.results,
      hasUtterances: !!data.results?.utterances,
      channels: data.results?.channels?.length,
      metadata: data.metadata
    });
    
    if (!data.results?.channels?.[0]?.alternatives?.[0]) {
      console.error('Invalid Deepgram response structure:', data);
      throw new Error('Invalid response from Deepgram: missing transcript data');
    }

    // Generate base filename without extension
    const baseFileName = `transcript-${Date.now()}`;

    // 1. Store audio file with error handling
    const audioFileName = `${baseFileName}.audio${mime_type.includes('wav') ? '.wav' : '.mp3'}`;
    const { error: audioUploadError } = await supabase.storage
      .from('transcriptions')
      .upload(audioFileName, audioData, {
        contentType: mime_type,
        upsert: false
      });

    if (audioUploadError) {
      console.error('Error uploading audio:', audioUploadError);
      throw new Error(`Failed to store audio file: ${audioUploadError.message}`);
    }

    // 2. Store raw JSON response
    const jsonFileName = `${baseFileName}.json`;
    const { error: jsonUploadError } = await supabase.storage
      .from('transcriptions')
      .upload(jsonFileName, JSON.stringify(data, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (jsonUploadError) {
      console.error('Error uploading JSON:', jsonUploadError);
      throw new Error(`Failed to store transcription data: ${jsonUploadError.message}`);
    }

    // Process the transcript text with error handling
    const transcript = data.results.channels[0].alternatives[0];
    const words = transcript.words || [];
    
    let utterances = [];
    let currentUtterance = null;

    try {
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
    } catch (error) {
      console.error('Error processing transcript words:', error);
      throw new Error('Failed to process transcript data');
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

    // 3. Store formatted transcript text
    const textFileName = `${baseFileName}.txt`;
    const { error: textUploadError } = await supabase.storage
      .from('transcriptions')
      .upload(textFileName, formattedTranscript, {
        contentType: 'text/plain',
        upsert: false
      });

    if (textUploadError) {
      console.error('Error uploading transcript text:', textUploadError);
      throw new Error(`Failed to store transcript text: ${textUploadError.message}`);
    }

    // Store metadata in database with error handling
    const { error: dbError } = await supabase
      .from('transcription_data')
      .insert({
        file_name: baseFileName,
        file_path: jsonFileName,
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model,
          audioFile: audioFileName,
          textFile: textFileName,
          jsonFile: jsonFileName
        },
        raw_response: data
      });

    if (dbError) {
      console.error('Error storing metadata:', dbError);
      throw new Error(`Failed to store transcription metadata: ${dbError.message}`);
    }

    console.log('Processing complete:', {
      utteranceCount: utterances.length,
      speakerCount: new Set(utterances.map(u => u.speaker)).size,
      transcriptLength: formattedTranscript.length,
      storedFiles: {
        audio: audioFileName,
        json: jsonFileName,
        text: textFileName
      }
    });

    return new Response(
      JSON.stringify({
        transcript: formattedTranscript,
        utterances,
        metadata: {
          duration: data.metadata?.duration,
          channels: data.metadata?.channels,
          model: data.metadata?.model,
          speakerCount: new Set(utterances.map(u => u.speaker)).size,
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
    // Enhanced error response with more details
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
