
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log("Starting PDF text extraction");
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    let fullText = '';

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const textContent = await page.doc.getText();
      fullText += textContent + '\n';
      console.log(`Processed page ${i + 1} of ${pages.length}`);
    }

    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  const text = new TextDecoder().decode(arrayBuffer);
  return text.replace(/[^\x20-\x7E\n]/g, '');
}

async function processFileWithRetry(
  fileData: ArrayBuffer,
  fileName: string,
  contentType: string,
  retryCount = 0
): Promise<{ text: string; fileName: string }> {
  try {
    console.log(`Processing file: ${fileName} (type: ${contentType}), attempt ${retryCount + 1}`);
    let text = '';

    if (contentType === 'application/pdf') {
      text = await extractTextFromPDF(fileData);
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDOCX(fileData);
    } else if (contentType === 'text/plain') {
      text = new TextDecoder().decode(fileData);
    } else {
      throw new Error(`Unsupported file type: ${contentType}`);
    }

    if (!text.trim()) {
      throw new Error('No text could be extracted from the document');
    }

    return {
      text: text.trim(),
      fileName: fileName
    };
  } catch (error) {
    console.error(`Error processing file (attempt ${retryCount + 1}):`, error);

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return processFileWithRetry(fileData, fileName, contentType, retryCount + 1);
    }

    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to process document');
    
    // Handle both FormData and direct file uploads
    let fileData: ArrayBuffer;
    let fileName: string;
    let contentType: string;

    const contentTypeHeader = req.headers.get('content-type') || '';
    
    if (contentTypeHeader.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        throw new Error('No file provided in form data');
      }
      
      fileData = await file.arrayBuffer();
      fileName = file.name;
      contentType = file.type;
    } else {
      fileData = await req.arrayBuffer();
      fileName = req.headers.get('x-file-name') || 'unknown.pdf';
      contentType = req.headers.get('content-type') || 'application/pdf';
    }

    console.log(`Processing ${fileName} (${contentType})`);

    const result = await processFileWithRetry(fileData, fileName, contentType);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing document:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});
