
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import PDFParser from 'https://esm.sh/pdf-parse@1.1.1'
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
    console.log("Received request to process document");
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      console.error("No file uploaded or invalid file");
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log("Processing file:", file.name, "Type:", file.type);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a sanitized filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const filePath = `${crypto.randomUUID()}.${fileExt}`

    // Convert File to ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer()

    let extractedText = ''

    // Extract text based on file type
    if (file.type === 'application/pdf' || fileExt === 'pdf') {
      console.log("Processing PDF file");
      const uint8Array = new Uint8Array(arrayBuffer)
      const pdfData = await PDFParser(uint8Array)
      extractedText = pdfData.text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExt === 'docx') {
      console.log("Processing DOCX file");
      const result = await mammoth.extractRawText({ arrayBuffer })
      extractedText = result.value
    } else {
      throw new Error('Unsupported file type')
    }

    console.log("Text extracted successfully, uploading to storage");

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        duplex: 'half'
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Error uploading file: ${uploadError.message}`)
    }

    console.log("File uploaded successfully, storing metadata");

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
      console.error("Database insert error:", dbError);
      throw new Error(`Error storing text: ${dbError.message}`)
    }

    console.log("Process completed successfully");

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
