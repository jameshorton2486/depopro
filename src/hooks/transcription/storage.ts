
import { supabase } from "@/integrations/supabase/client";
import { StoredTranscription } from "./types";

export async function cleanupOldFiles(): Promise<void> {
  try {
    const { data: files, error: fetchError } = await supabase
      .from('transcription_data')
      .select('*') as { data: StoredTranscription[] | null; error: any };

    if (fetchError) throw fetchError;

    if (files?.length) {
      // Delete storage objects
      for (const file of files) {
        if (file.file_path) {
          await supabase.storage
            .from('transcriptions')
            .remove([file.file_path]);
        }
      }

      // Delete database records
      const { error: deleteError } = await supabase
        .from('transcription_data')
        .delete()
        .in('id', files.map(f => f.id));

      if (deleteError) throw deleteError;
    }
  } catch (error) {
    console.error('Failed to cleanup old files:', error);
  }
}

export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
