
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchAndProcessFile(url: string): Promise<string> {
  console.log('Starting file fetch from URL:', url);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  console.log('File content type:', contentType);

  // For now, we'll treat all files as text files
  // This is a temporary solution until we can properly implement PDF processing
  const text = await response.text();
  
  // Basic cleanup of the text
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

serve(async (req) => {
  // Add CORS headers to all responses
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { fileUrl, text } = await req.json();
    console.log('Received request with:', { fileUrl: !!fileUrl, text: !!text });

    // If text is provided directly, return it
    if (text) {
      return new Response(
        JSON.stringify({ text, fileName: 'text-chunk.txt' }),
        { headers }
      );
    }

    // Validate fileUrl
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    console.log('Processing file from URL:', fileUrl);
    const extractedText = await fetchAndProcessFile(fileUrl);
    console.log('Successfully processed file, text length:', extractedText.length);

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: fileUrl.split('/').pop() 
      }),
      { headers }
    );

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers,
        status: 500
      }
    );
  }
});
