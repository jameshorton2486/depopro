
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { extractTextFromPdf } from 'https://esm.sh/pdf-parse@1.1.1'
import * as mammoth from 'https://esm.sh/mammoth@1.6.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const filePath = `${crypto.randomUUID()}.${fileExt}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`)
    }

    // Get the file URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Download the file for processing
    const fileResponse = await fetch(publicUrl)
    const fileBuffer = await fileResponse.arrayBuffer()

    let extractedText = ''

    // Extract text based on file type
    if (file.type === 'application/pdf' || fileExt === 'pdf') {
      const pdfData = await extractTextFromPdf(new Uint8Array(fileBuffer))
      extractedText = pdfData.text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExt === 'docx') {
      const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer })
      extractedText = result.value
    }

    // Store the extracted text in the database
    const { error: dbError } = await supabase
      .from('document_texts')
      .insert({
        file_name: file.name,
        file_path: filePath,
        content_type: file.type,
        extracted_text: extractedText
      })

    if (dbError) {
      throw new Error(`Error storing text: ${dbError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: extractedText,
        fileName: file.name 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
