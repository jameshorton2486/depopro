
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { DeepgramOptions } from "@/types/deepgram";
import { generateFileHash } from "./storage";
import { simulateProgress } from "./progress";

export async function handleFileUpload(
  file: File,
  cleanup: () => Promise<void>
): Promise<string | null> {
  console.log('Starting file upload process:', {
    fileName: file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    fileType: file.type
  });

  const fileHash = await generateFileHash(file);
  await cleanup();
  const cached = await transcriptProcessor.getCachedTranscript(fileHash);
  
  console.log('File hash generated:', {
    hash: fileHash,
    hasCachedVersion: !!cached
  });
  
  return cached ? fileHash : null;
}

export async function transcribeAudio(
  file: File,
  options: DeepgramOptions,
  progressInterval: NodeJS.Timeout,
  setProgress: (progress: number) => void
) {
  try {
    // Log the file details and options
    console.log('Starting transcription process:', {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      fileType: file.type,
      options: JSON.stringify(options, null, 2)
    });

    // First upload the file to Supabase Storage
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    console.log('Uploading file to Supabase Storage:', { fileName });

    const { error: uploadError } = await supabase.storage
      .from('transcriptions')
      .upload(fileName, file);

    if (uploadError) {
      console.error('File upload error:', uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully, starting transcription...');

    // Now call the transcribe function with the file path
    const { data, error } = await supabase.functions.invoke('transcribe', {
      body: {
        fileName,
        options
      }
    });

    console.log('Transcription response:', {
      success: !error,
      data: JSON.stringify(data, null, 2),
      error: error ? JSON.stringify(error, null, 2) : null
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    clearInterval(progressInterval);
    setProgress(100);
    
    return data;
  } catch (error) {
    console.error('Transcription error:', {
      error: JSON.stringify(error, null, 2),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export function handleDownload(transcript: string): void {
  if (!transcript) return;
  console.log('Downloading transcript as Word document');
  createAndDownloadWordDoc(transcript);
  toast.success("Transcript downloaded as Word document");
}
