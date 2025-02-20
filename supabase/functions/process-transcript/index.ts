
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TOKENS = 4000;
const RETRY_ATTEMPTS = 3;
const TIMEOUT = 180000; // 180 seconds

async function processChunkWithRetry(chunk: string, rules: any, attempt = 1): Promise<string> {
  try {
    console.log(`Processing chunk attempt ${attempt}/${RETRY_ATTEMPTS}. Chunk length: ${chunk.length}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional legal transcript corrector. Apply these rules: ${JSON.stringify(rules)}`
          },
          {
            role: 'user',
            content: chunk
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent corrections
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error processing chunk (attempt ${attempt}):`, error);
    
    if (attempt < RETRY_ATTEMPTS) {
      // Add exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      return processChunkWithRetry(chunk, rules, attempt + 1);
    }
    
    // If chunk is large and we've had multiple failures, try splitting it
    if (chunk.length > 1000) {
      console.log("Splitting large chunk for processing");
      const mid = Math.floor(chunk.length / 2);
      const leftHalf = await processChunkWithRetry(chunk.slice(0, mid), rules);
      const rightHalf = await processChunkWithRetry(chunk.slice(mid), rules);
      return leftHalf + rightHalf;
    }
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, rules } = await req.json();

    if (!text) {
      throw new Error('No text provided');
    }

    // Process text in chunks based on sentence boundaries
    const chunks = text.match(/[^.!?]+[.!?]+/g) || [text];
    console.log(`Processing ${chunks.length} chunks`);

    // Add rate limiting
    const processed = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);
      
      const correctedChunk = await processChunkWithRetry(chunk, rules);
      processed.push(correctedChunk);

      // Add a small delay between chunks to respect rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const correctedText = processed.join(' ');

    // Validate output length
    if (correctedText.length < text.length * 0.9) {
      console.error("Significant content loss detected");
      throw new Error("Significant content loss detected during processing");
    }

    return new Response(JSON.stringify({ correctedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing transcript:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
