
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"
import { createClient as createDeepgramClient, DeepgramClient } from "https://esm.sh/@deepgram/sdk@3.0.0"

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

// Custom fetch handler for Deepgram with logging
const customFetchHandler: typeof fetch = async (input, init) => {
  console.log('Deepgram API request:', {
    url: typeof input === 'string' ? input : input.url,
    method: init?.method,
    headers: init?.headers
  })
  
  const response = await fetch(input, init)
  console.log('Deepgram API response status:', response.status)
  
  return response
}

// Initialize clients with proper SDK configuration
const deepgram = createDeepgramClient(deepgramApiKey, {
  global: {
    fetch: {
      client: customFetchHandler,
      options: {
        headers: {
          'User-Agent': 'Supabase Edge Function',
        }
      }
    }
  }
}) as DeepgramClient

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

    // Using SDK v3's listen.prerecorded namespace
    console.log('Attempting transcription with Deepgram...')
    const { result } = await deepgram.listen.prerecorded.transcribeUrl({
      url: publicUrl,
      options: {
        ...options,
        smart_format: true,
        diarize: true,
        punctuate: true,
        model: options.model || 'nova-3',
        language: options.language || 'en-US'
      }
    })

    if (!result || !result.results) {
      console.error('Invalid response from Deepgram:', result)
      throw new Error('Invalid response from Deepgram')
    }

    console.log('Transcription completed successfully')
    console.log('Response structure:', Object.keys(result))
    return result
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

serve(async (req) => {
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
