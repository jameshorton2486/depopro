
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
  const fileData = new FormData();
  fileData.append('file', file);
  fileData.append('options', JSON.stringify(options));

  const { data, error } = await supabase.functions.invoke('transcribe', {
    body: {
      options,
      fileName: file.name,
      audioType: file.type,
      mimeType: file.type
    }
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);

  clearInterval(progressInterval);
  setProgress(100);
  await new Promise(resolve => setTimeout(resolve, 500));

  return data;
}

export function handleDownload(transcript: string): void {
  if (!transcript) return;
  createAndDownloadWordDoc(transcript);
  toast.success("Transcript downloaded as Word document");
}
