
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

    console.log('Processing audio with options:', options)

    // Extract the actual base64 content from the data URL
    const base64Data = audioData.replace(/^data:.+;base64,/, '')
    
    // Convert base64 to Uint8Array
    const audioBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

    // Create a blob with the correct mime type
    const formData = new FormData()
    formData.append('file', new Blob([audioBytes]), 'audio.mp3')

    // Add Deepgram parameters
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
    }

    console.log('Sending request to Deepgram')

    const response = await fetch("https://api.deepgram.com/v1/listen", {
      method: "POST",
      headers: {
        "Authorization": `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Deepgram error response:', errorText)
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully received Deepgram response')

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
