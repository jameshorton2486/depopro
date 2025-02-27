
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioData, options } = await req.json()

    if (!audioData) {
      throw new Error('No audio data provided')
    }

    console.log('Processing audio data with options:', options)

    // Convert base64 to buffer
    const binaryString = atob(audioData.split(',')[1])
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Create FormData with audio file
    const formData = new FormData()
    formData.append('file', new Blob([bytes]), 'audio.mp3')

    // Send request to Deepgram
    const response = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: {
        "Authorization": `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Received response from Deepgram')

    return new Response(
      JSON.stringify(data),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in transcribe-audio function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
