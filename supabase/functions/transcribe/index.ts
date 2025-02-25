
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { DeepgramClient } from "https://esm.sh/@deepgram/sdk@2.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Deepgram client
const deepgram = new DeepgramClient(Deno.env.get('DEEPGRAM_API_KEY') || '');

// Create Supabase client for storage access
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const validateOptions = (options: any) => {
  const requiredOptions = {
    diarize: true,
    punctuate: true,
    smart_format: true,
    paragraphs: true,
    filler_words: true,
    utterances: true
  };

  const violations = Object.entries(requiredOptions).filter(([key, value]) => {
    return options[key] === false || options[key] === undefined;
  });

  if (violations.length > 0) {
    const missingOptions = violations.map(([key]) => key).join(', ');
    throw new Error(`Cannot disable required options: ${missingOptions}`);
  }
};

const enforceOptions = (userOptions: any): any => {
  validateOptions(userOptions);
  return {
    ...userOptions,
    diarize: true,
    punctuate: true,
    smart_format: true,
    paragraphs: true,
    filler_words: true,
    utterances: true
  };
};

const transcribeFile = async (fileUrl: string, options: any) => {
  const enforcedOptions = enforceOptions(options);
  console.log('Transcribing with enforced options:', enforcedOptions);
  
  return deepgram.listen.prerecorded.transcribeUrl(
    { url: fileUrl },
    enforcedOptions
  );
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, options } = await req.json()

    if (!fileName) {
      return new Response(
        JSON.stringify({ error: 'No file name provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      validateOptions(options);
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl }, error: urlError } = await supabase.storage
      .from('audio_file')
      .getPublicUrl(fileName)

    if (urlError) throw urlError

    console.log('Starting transcription with URL:', publicUrl);
    const response = await transcribeFile(publicUrl, options);
    
    // Verify response contains required fields
    if (!response?.results?.channels?.[0]?.alternatives?.[0]?.paragraphs) {
      throw new Error('Invalid response: Missing required paragraph segmentation');
    }

    return new Response(
      JSON.stringify({ data: response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
