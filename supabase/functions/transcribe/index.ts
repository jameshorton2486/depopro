
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DeepgramClient } from "https://esm.sh/@deepgram/sdk@2.4.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const deepgram = new DeepgramClient(Deno.env.get('DEEPGRAM_API_KEY') || '');

const enforceOptions = (userOptions: any): any => ({
  ...userOptions,
  diarize: true,
  punctuate: true,
  smart_format: true,
  paragraphs: true,
  filler_words: true,
  utterances: true
});

const transcribeFile = async (fileUrl: string, options: any) => {
  const enforcedOptions = enforceOptions(options);
  console.log('Transcribing with enforced options:', enforcedOptions);
  return deepgram.listen.prerecorded.transcribeUrl(
    { url: fileUrl },
    enforcedOptions
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileName, options } = await req.json()

    if (!fileName) {
      throw new Error('No file name provided')
    }

    const { data: { publicUrl }, error: urlError } = await supabase.storage
      .from('audio_file')
      .getPublicUrl(fileName)

    if (urlError) throw urlError

    console.log('Starting transcription with URL:', publicUrl);
    const response = await transcribeFile(publicUrl, options);
    
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
