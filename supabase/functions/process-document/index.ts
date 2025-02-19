
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, text } = await req.json();
    console.log('Request received with:', { fileUrl, hasText: !!text });

    // If direct text is provided, return it
    if (text) {
      console.log('Processing direct text input');
      return new Response(
        JSON.stringify({ text }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!fileUrl) {
      console.log('No file URL provided');
      return new Response(
        JSON.stringify({ error: 'No file URL provided' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Fetching file from URL:', fileUrl);
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      const error = `Failed to fetch document: ${response.statusText}`;
      console.error(error);
      throw new Error(error);
    }

    const contentType = response.headers.get('content-type');
    console.log('File content type:', contentType);

    // For now, treat all files as text
    // This is a temporary solution until we implement proper PDF parsing
    const text = await response.text();
    console.log('Text extraction completed, length:', text.length);

    return new Response(
      JSON.stringify({ 
        text,
        fileName: fileUrl.split('/').pop() 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process document',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
