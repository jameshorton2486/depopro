
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DeepgramClient } from 'https://esm.sh/@deepgram/sdk@2.4.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audio, mime_type, options } = await req.json()

    if (!audio || !mime_type) {
      throw new Error('Missing required parameters')
    }

    console.log('Processing audio request:', {
      mimeType: mime_type,
      options: JSON.stringify(options),
      timestamp: new Date().toISOString()
    })

    // Initialize Deepgram client
    const deepgram = new DeepgramClient(Deno.env.get('DEEPGRAM_API_KEY') || '')

    // Convert array to Uint8Array for Deepgram
    const audioData = new Uint8Array(audio)

    // Process with Deepgram
    const response = await deepgram.listen.prerecorded.transcribeFile(
      audioData,
      {
        mimetype: mime_type,
        model: options.model || 'nova-2',
        language: options.language || 'en-US',
        smart_format: options.smart_format !== false,
        diarize: options.diarize === true,
        diarize_version: options.diarize ? "3" : undefined,
        punctuate: options.punctuate !== false,
        utterances: options.utterances === true,
        numerals: options.numerals === true,
        search: options.search || undefined,
        replace: options.replace || undefined,
        profanity_filter: options.profanity_filter === true,
        redact: options.redact || undefined,
        alternatives: options.alternatives || 1,
        keywords: options.keywords || undefined,
        detect_topics: options.detect_topics === true,
        summarize: options.summarize === true,
        detect_language: options.detect_language === true
      }
    )

    const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''

    console.log('Transcription completed:', {
      length: transcript.length,
      metadata: response.metadata,
      timestamp: new Date().toISOString()
    })

    return new Response(
      JSON.stringify({ 
        transcript,
        metadata: response.metadata
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error processing audio:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
