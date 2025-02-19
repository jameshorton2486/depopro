
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js/+esm'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

async function extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  // For DOCX files, we'll use a simple text extraction for now
  const text = new TextDecoder().decode(arrayBuffer);
  return text.replace(/[^\x20-\x7E\n]/g, ''); // Remove non-printable characters
}

async function processFileWithRetry(
  file: File,
  retryCount = 0
): Promise<{ text: string; fileName: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    let text = '';

    console.log(`Processing file: ${file.name} (type: ${file.type})`);

    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(arrayBuffer);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDOCX(arrayBuffer);
    } else if (file.type === 'text/plain') {
      text = await file.text();
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    if (!text.trim()) {
      throw new Error('No text could be extracted from the document');
    }

    return {
      text: text.trim(),
      fileName: file.name
    };
  } catch (error) {
    console.error(`Error processing file (attempt ${retryCount + 1}):`, error);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return processFileWithRetry(file, retryCount + 1);
    }

    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to process document');
    
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.error('No file uploaded or invalid file');
      return new Response(
        JSON.stringify({ error: 'No file uploaded or invalid file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 1MB limit' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process the file with retry logic
    const result = await processFileWithRetry(file);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error processing document:', error);

    // Structured error response
    const errorResponse = {
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error',
      code: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
    };

    return new Response(
      JSON.stringify(errorResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
