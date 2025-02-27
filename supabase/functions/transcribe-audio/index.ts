
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
    const { audioData, audioUrl, options, isYouTube } = await req.json()

    if (!audioData && !audioUrl) {
      throw new Error('No audio data or URL provided')
    }

    console.log('Processing with options:', options)

    let audioBytes: Uint8Array | null = null;
    let audioUrlToFetch = audioUrl;
    
    // Handle base64 audio data
    if (audioData) {
      console.log('Processing audio data from base64')
      // Extract the actual base64 content from the data URL
      const base64Data = audioData.replace(/^data:.+;base64,/, '')
      
      // Convert base64 to Uint8Array
      audioBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    } 
    // Handle YouTube URL
    else if (isYouTube) {
      console.log('Processing YouTube URL:', audioUrl)
      // In a real implementation, you would extract audio from YouTube
      // This would typically involve using a third-party service or API
      throw new Error('YouTube extraction is not implemented in this demo edge function')
    }

    console.log('Preparing Deepgram API request')
    
    // Direct API call to Deepgram without SDK
    const apiOptions = new URLSearchParams()
    
    // Add Deepgram parameters to URL
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && typeof value !== 'object') {
          apiOptions.append(key, String(value))
        }
      })
    }
    
    const url = `https://api.deepgram.com/v1/listen?${apiOptions.toString()}`
    
    console.log('Sending request to Deepgram API')
    
    let response;
    
    if (audioBytes) {
      // Send binary audio data
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
          "Content-Type": "audio/mpeg",
        },
        body: audioBytes,
      })
    } else if (audioUrlToFetch) {
      // Send URL to Deepgram
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: audioUrlToFetch
        }),
      })
    } else {
      throw new Error('No valid audio source provided')
    }

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
