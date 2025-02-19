
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchAndProcessFile(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || '';

  if (contentType === 'application/pdf') {
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    let text = '';

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const textContent = await page.doc.getText();
      text += textContent + '\n';
    }

    return text;
  } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // For DOCX files, return the raw text content
    return new TextDecoder().decode(arrayBuffer);
  } else if (contentType === 'text/plain') {
    return new TextDecoder().decode(arrayBuffer);
  } else {
    throw new Error(`Unsupported file type: ${contentType}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileUrl, text } = await req.json();

    // If text is provided directly, process it
    if (text) {
      return new Response(
        JSON.stringify({ text, fileName: 'text-chunk.txt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If fileUrl is provided, fetch and process the file
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }

    console.log('Processing file from URL:', fileUrl);
    const extractedText = await fetchAndProcessFile(fileUrl);

    return new Response(
      JSON.stringify({ 
        text: extractedText,
        fileName: fileUrl.split('/').pop() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
