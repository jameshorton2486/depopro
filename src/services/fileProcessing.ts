
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { splitTextIntoChunks } from "@/utils/textProcessing";

export const MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024; // 3GB in bytes

export const processTextInBatches = async (
  text: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  const chunks = splitTextIntoChunks(text);
  const processedChunks: string[] = [];
  
  console.log(`Processing ${chunks.length} chunks of text`);

  for (let i = 0; i < chunks.length; i++) {
    try {
      const { data, error } = await supabase.functions.invoke('process-audio', {
        body: { text: chunks[i] },
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) throw error;
      
      processedChunks.push(data.text);
      onProgress(Math.round(((i + 1) / chunks.length) * 100));
      
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing chunk ${i}:`, error);
      toast.error(`Error processing audio chunk ${i + 1}`);
    }
  }

  return processedChunks.join(' ');
};

export const uploadAndProcessFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<{ text: string; name: string }> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('audio')
    .getPublicUrl(filePath);

  console.log("Audio file uploaded successfully, processing...");

  const { data, error } = await supabase.functions.invoke('process-audio', {
    body: { fileUrl: publicUrl },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  const processedText = await processTextInBatches(data.text, onProgress);

  // Clean up: remove the temporary file from storage
  await supabase.storage
    .from('audio')
    .remove([filePath]);

  return {
    text: processedText,
    name: file.name
  };
};
