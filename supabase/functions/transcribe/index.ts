
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    const { options, fileName } = await req.json()

    const apiKey = Deno.env.get('DEEPGRAM_API_KEY')
    if (!apiKey) {
      throw new Error('Deepgram API key not configured')
    }

    // Get the file URL from Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/transcriptions/${fileName}`

    console.log('Starting transcription:', {
      fileUrl,
      options
    })

    // Call Deepgram API
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: fileUrl,
        model: options.model || 'nova-meeting',
        language: options.language || 'en-US',
        smart_format: true,
        diarize: true,
        utterances: false,
        punctuate: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Deepgram API error:', errorText)
      throw new Error(`Deepgram API error: ${errorText}`)
    }

    const data = await response.json()
    
    console.log('Transcription completed successfully')

    return new Response(
      JSON.stringify({ data }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in transcribe function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
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
