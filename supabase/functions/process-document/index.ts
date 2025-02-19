
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as pdfjsLib from 'https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  // Configure PDF.js worker
  const workerSrc = 'https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.worker.js';
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;
  
  let fullText = '';

  // Iterate through each page
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

async function fetchAndProcessFile(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || '';

  console.log('Processing file with content type:', contentType);

  if (contentType.includes('pdf')) {
    return await extractTextFromPdf(arrayBuffer);
  } else if (contentType.includes('docx')) {
    // For DOCX files, return the raw text content
    return new TextDecoder().decode(arrayBuffer);
  } else if (contentType.includes('text/plain')) {
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
