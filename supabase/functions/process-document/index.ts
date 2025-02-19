
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText.trim();
}

async function processDocument(fileUrl: string, fileType: string): Promise<string> {
  console.log(`Processing document of type: ${fileType}`);
  
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  
  if (fileType === 'application/pdf') {
    return await extractTextFromPdf(arrayBuffer);
  } else {
    // For text files and other formats, convert to text directly
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(arrayBuffer);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, text } = await req.json();

    // If direct text is provided, return it
    if (text) {
      return new Response(
        JSON.stringify({ text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate fileUrl
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: 'No file URL provided' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing file from URL:', fileUrl);

    // Detect file type from URL
    const fileType = fileUrl.toLowerCase().endsWith('.pdf') 
      ? 'application/pdf'
      : 'text/plain';

    const extractedText = await processDocument(fileUrl, fileType);

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: fileUrl.split('/').pop() 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
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
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
