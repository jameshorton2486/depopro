
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { Document } from "https://esm.sh/docx@8.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    const doc = new Document(buffer);
    let text = '';
    
    doc.sections.forEach(section => {
      section.paragraphs.forEach(paragraph => {
        text += paragraph.text + '\n';
      });
    });

    return text.trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check if we're processing raw text or a file URL
    const body = await req.json();
    
    if (body.text) {
      // If raw text is provided, return it directly
      console.log('Processing raw text input');
      return new Response(
        JSON.stringify({ text: body.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.fileUrl) {
      throw new Error('No file URL or text provided');
    }

    console.log('Fetching file from URL:', body.fileUrl);
    
    // Fetch the file
    const fileResponse = await fetch(body.fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
    }

    const contentType = fileResponse.headers.get('content-type');
    console.log('Processing file with content type:', contentType);

    const buffer = await fileResponse.arrayBuffer();
    let text = '';

    // Process based on file type
    if (contentType?.includes('text/plain')) {
      text = new TextDecoder().decode(buffer);
      console.log('Processed text file successfully');
    } else if (contentType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      text = await extractTextFromDocx(buffer);
      console.log('Processed DOCX file successfully');
    } else {
      throw new Error(`Unsupported file type: ${contentType}. Only .txt and .docx files are supported.`);
    }

    if (!text) {
      throw new Error('No text could be extracted from the file');
    }

    console.log('Text extraction successful. Character count:', text.length);

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
