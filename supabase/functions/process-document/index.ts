
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import pdfParse from "https://esm.sh/pdf-parse@1.1.1"
import { Document } from "https://esm.sh/docx@8.5.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    const doc = new Document(buffer);
    let text = '';

    // Extract text from each paragraph
    doc.sections.forEach(section => {
      section.paragraphs.forEach(paragraph => {
        paragraph.children.forEach(child => {
          if (child.text) {
            text += child.text + '\n';
          }
        });
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl } = await req.json()
    
    if (!fileUrl) {
      throw new Error('No file URL provided')
    }

    console.log('Fetching file from URL:', fileUrl)
    
    // Fetch the file
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.statusText}`)
    }

    const contentType = fileResponse.headers.get('content-type')
    const buffer = await fileResponse.arrayBuffer()
    let text = ''

    console.log('Processing file with content type:', contentType)

    // Process based on file type
    if (contentType?.includes('pdf')) {
      const data = await pdfParse(new Uint8Array(buffer))
      text = data.text
    } else if (contentType?.includes('text/plain')) {
      text = new TextDecoder().decode(buffer)
    } else if (contentType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      text = await extractTextFromDocx(buffer)
    } else {
      throw new Error(`Unsupported file type: ${contentType}`)
    }

    if (!text) {
      throw new Error('No text could be extracted from the file')
    }

    console.log('Successfully extracted text from file, length:', text.length)

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (error) {
    console.error('Error processing document:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
