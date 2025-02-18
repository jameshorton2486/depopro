
import "https://deno.land/x/xhr@0.1.0/mod.ts"
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
    const { originalTranscript, correctedTranscript } = await req.json()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a transcript analysis expert. Analyze the differences between the original and corrected transcripts to generate training rules. Focus on:
              1. Spelling corrections
              2. Grammar improvements
              3. Punctuation changes
              4. Formatting patterns
              
              Return the rules in this JSON format:
              {
                "rules": [
                  {
                    "type": "spelling|grammar|punctuation|formatting",
                    "pattern": "identified pattern",
                    "correction": "how to correct it",
                    "description": "explanation of the rule"
                  }
                ]
              }`
          },
          {
            role: "user",
            content: `Original transcript:\n${originalTranscript}\n\nCorrected transcript:\n${correctedTranscript}`
          }
        ]
      })
    })

    const data = await response.json()
    const generatedRules = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(generatedRules),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
