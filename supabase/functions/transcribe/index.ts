
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Deepgram } from "https://esm.sh/@deepgram/sdk";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TranscribeRequest {
  audioData: string;
  fileName: string;
  options: {
    model: string;
    language: string;
    smart_format: boolean;
    diarize: boolean;
    punctuate: boolean;
    filler_words: boolean;
    paragraphs: boolean;
    keyterms?: Array<{ term: string; boost: number; category: string; }>;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!apiKey) {
      throw new Error('Deepgram API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const deepgram = new Deepgram(apiKey);

    let requestData: TranscribeRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      console.error('Failed to parse request JSON:', error);
      throw new Error('Invalid request format');
    }

    if (!requestData.audioData || !requestData.options) {
      throw new Error('Missing required data');
    }

    console.log('Processing audio file:', {
      fileName: requestData.fileName,
      options: { ...requestData.options, audioData: '[REDACTED]' }
    });

    let binaryData: Uint8Array;
    try {
      binaryData = Uint8Array.from(atob(requestData.audioData), c => c.charCodeAt(0));
      console.log('Successfully decoded audio data, size:', binaryData.length);
    } catch (error) {
      console.error('Failed to decode base64 audio data:', error);
      throw new Error('Invalid audio data format');
    }

    // Store audio file
    const audioFileName = `${Date.now()}_${requestData.fileName}`;
    const { error: audioUploadError } = await supabase.storage
      .from('transcriptions')
      .upload(audioFileName, binaryData.buffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (audioUploadError) {
      throw new Error(`Failed to store audio file: ${audioUploadError.message}`);
    }

    // Process with Deepgram
    const source = {
      buffer: binaryData,
      mimetype: 'audio/wav'
    };

    const result = await deepgram.transcription.preRecorded(source, {
      ...requestData.options,
      model: requestData.options.model || 'nova-meeting',
      language: requestData.options.language || 'en-US',
      smart_format: true,
      diarize: requestData.options.diarize ?? true,
      paragraphs: true
    });

    if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response format from Deepgram');
    }

    // Store JSON result
    const jsonFileName = `${Date.now()}_${requestData.fileName}.json`;
    const { error: jsonUploadError } = await supabase.storage
      .from('transcriptions')
      .upload(jsonFileName, JSON.stringify(result), {
        contentType: 'application/json',
        upsert: false
      });

    if (jsonUploadError) {
      throw new Error(`Failed to store JSON result: ${jsonUploadError.message}`);
    }

    // Store file references in database
    const { error: dbError } = await supabase
      .from('transcription_files')
      .insert({
        audio_file_path: audioFileName,
        json_file_path: jsonFileName,
        file_name: requestData.fileName,
        metadata: {
          model: requestData.options.model,
          language: requestData.options.language,
          duration: result.metadata?.duration
        }
      });

    if (dbError) {
      throw new Error(`Failed to store file references: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        data: result,
        status: 'success',
        files: {
          audio: audioFileName,
          json: jsonFileName
        }
      }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
