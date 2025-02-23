
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
  const fileHash = await generateFileHash(file);
  await cleanup();
  const cached = await transcriptProcessor.getCachedTranscript(fileHash);
  return cached ? fileHash : null;
}

export async function transcribeAudio(
  file: File,
  options: DeepgramOptions,
  progressInterval: NodeJS.Timeout,
  setProgress: (progress: number) => void
) {
  try {
    // First upload the file to Supabase Storage
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('transcriptions')
      .upload(fileName, file);

    if (uploadError) {
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

    if (error) throw error;
    if (data.error) throw new Error(data.error);

    clearInterval(progressInterval);
    setProgress(100);
    
    return data;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

export function handleDownload(transcript: string): void {
  if (!transcript) return;
  createAndDownloadWordDoc(transcript);
  toast.success("Transcript downloaded as Word document");
}
