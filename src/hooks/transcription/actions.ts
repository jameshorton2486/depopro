
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { transcriptProcessor } from "@/utils/transcriptProcessor";
import { createAndDownloadWordDoc } from "@/utils/documentUtils";
import { DeepgramOptions } from "@/types/deepgram";
import { generateFileHash } from "./storage";

export async function handleFileUpload(file: File): Promise<string | null> {
  console.log('Processing file:', {
    fileName: file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    fileType: file.type
  });

  return generateFileHash(file);
}

export async function transcribeAudio(
  file: File,
  options: DeepgramOptions,
  setProgress: (progress: number) => void
) {
  try {
    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('transcriptions')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    setProgress(50);
    const { data, error } = await supabase.functions.invoke('transcribe', {
      body: { fileName, options }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);

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
  toast.success("Transcript downloaded");
}
