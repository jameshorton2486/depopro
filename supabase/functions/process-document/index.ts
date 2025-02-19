
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchAndProcessFile(url: string): Promise<string> {
  try {
    console.log('Starting file fetch from URL:', url);
    
    const response = await fetch(url);
    console.log('Fetch response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('File content type:', contentType);

    let text: string;
    try {
      text = await response.text();
      console.log('Successfully extracted text, length:', text.length);
    } catch (textError) {
      console.error('Error extracting text:', textError);
      throw new Error(`Failed to extract text from file: ${textError.message}`);
    }

    // Basic cleanup of the text
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('Cleaned text length:', cleanedText.length);
    return cleanedText;
  } catch (error) {
    console.error('Error in fetchAndProcessFile:', error);
    throw error; // Re-throw to be handled by the main try-catch
  }
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
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed:', { 
        hasFileUrl: !!requestBody?.fileUrl, 
        hasText: !!requestBody?.text 
      });
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { fileUrl, text } = requestBody;

    // If text is provided directly, return it
    if (text) {
      console.log('Processing direct text input');
      return new Response(
        JSON.stringify({ 
          text, 
          fileName: 'text-chunk.txt' 
        }),
        { headers }
      );
    }

    // Validate fileUrl
    if (!fileUrl) {
      console.error('No file URL provided in request');
      throw new Error('No file URL provided');
    }

    console.log('Starting file processing');
    const extractedText = await fetchAndProcessFile(fileUrl);
    console.log('File processing completed successfully');

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: fileUrl.split('/').pop() 
      }),
      { headers }
    );

  } catch (error) {
    console.error('Error in edge function:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process document',
        details: error.message,
        type: error.name
      }),
      { 
        headers,
        status: 500
      }
    );
  }
});
