
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    if (!DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured')
    }

    // Sample audio for testing (very short clip)
    const testAudioUrl = 'https://static.deepgram.com/examples/interview_speech-analytics.wav';

    // Test the transcription process
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=en-US', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testAudioUrl
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Transcription test failed:', error);
      throw new Error(`Transcription failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Test transcription completed successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Transcription test successful',
        transcript: result.results?.channels[0]?.alternatives[0]?.transcript || '',
        duration: result.metadata?.duration || 0
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error testing transcription:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
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
