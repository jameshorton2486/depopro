
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import pdfParse from "https://esm.sh/pdf-parse@1.1.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Process based on file type
    if (contentType?.includes('pdf')) {
      const data = await pdfParse(new Uint8Array(buffer))
      text = data.text
    } else if (contentType?.includes('text/plain')) {
      text = new TextDecoder().decode(buffer)
    } else if (contentType?.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      // For DOCX files, we'll need to extract text in a different way
      // For now, return an error
      throw new Error('DOCX processing not yet implemented')
    } else {
      throw new Error(`Unsupported file type: ${contentType}`)
    }

    console.log('Successfully extracted text from file')

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
