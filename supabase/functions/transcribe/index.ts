
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Deepgram } from 'https://esm.sh/@deepgram/sdk@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')
if (!deepgramApiKey) {
  console.error('Missing DEEPGRAM_API_KEY environment variable')
  throw new Error('Missing DEEPGRAM_API_KEY')
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

// Initialize Deepgram with proper typing
const deepgram = new Deepgram(deepgramApiKey)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function transcribeFile(fileName: string, options: any) {
  console.log('Starting transcription for file:', fileName)
  console.log('Using options:', JSON.stringify(options, null, 2))
  
  try {
    // Get file URL from Supabase Storage
    const { data: { publicUrl } } = supabase.storage
      .from('transcriptions')
      .getPublicUrl(fileName)

    if (!publicUrl) {
      console.error('Failed to get public URL for file:', fileName)
      throw new Error('Failed to get file URL')
    }

    console.log('Got public URL:', publicUrl)

    // Using the correct method from v3.0.0 of the SDK
    console.log('Attempting transcription with Deepgram...')
    const transcription = await deepgram.listen.prerecorded.transcribeUrl(
      { url: publicUrl },
      {
        ...options,
        smart_format: true,
        diarize: true,
        punctuate: true,
        model: options.model || 'nova-2',
        language: options.language || 'en-US'
      }
    )

    if (!transcription || !transcription.results) {
      console.error('Invalid response from Deepgram:', transcription)
      throw new Error('Invalid response from Deepgram')
    }

    console.log('Transcription completed successfully')
    console.log('Response structure:', Object.keys(transcription))
    return transcription
  } catch (error) {
    console.error('Transcription error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, options } = await req.json()

    if (!fileName) {
      console.error('Missing fileName in request')
      throw new Error('Missing fileName in request')
    }

    console.log('Processing request for file:', fileName)
    console.log('Request options:', options)

    const transcription = await transcribeFile(fileName, options)

    // Store the transcription result
    const { error: dbError } = await supabase
      .from('transcription_data')
      .insert({
        file_name: fileName,
        raw_response: transcription,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database error:', dbError)
      throw dbError
    }

    console.log('Successfully stored transcription result')
    return new Response(
      JSON.stringify({ data: transcription }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
