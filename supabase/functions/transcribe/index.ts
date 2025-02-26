
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Deepgram } from 'https://esm.sh/@deepgram/sdk@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY')
if (!deepgramApiKey) {
  throw new Error('Missing DEEPGRAM_API_KEY')
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const deepgram = new Deepgram(deepgramApiKey)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function transcribeFile(fileName: string, options: any) {
  console.log('Transcribing file:', fileName, 'with options:', options)
  
  try {
    // Get file URL from Supabase Storage
    const { data: { publicUrl } } = supabase.storage
      .from('transcriptions')
      .getPublicUrl(fileName)

    if (!publicUrl) {
      throw new Error('Failed to get file URL')
    }

    console.log('Transcribing from URL:', publicUrl)

    // Use the preRecorded method instead of preRecordedUrl
    const response = await deepgram.listen.prerecorded.transcribeUrl(
      { url: publicUrl },
      {
        ...options,
        smart_format: true,
        diarize: true,
        punctuate: true,
      }
    )

    console.log('Transcription completed successfully')
    return response
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, options } = await req.json()

    if (!fileName) {
      throw new Error('Missing fileName in request')
    }

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
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error
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
