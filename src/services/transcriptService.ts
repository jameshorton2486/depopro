
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

export const createTranscriptRecord = async (
  file: File,
  userId: string
) => {
  const { data, error } = await supabase
    .from('transcripts')
    .insert({
      name: file.name,
      file_type: file.type,
      file_size: file.size,
      status: 'pending',
      original_text: '',
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create transcript record: ${error.message}`);
  }

  return data;
};

export const updateTranscriptStatus = async (
  id: number,
  status: 'processing' | 'corrected'
) => {
  const { error } = await supabase
    .from('transcripts')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error(`Failed to update transcript status to ${status}:`, error);
  }
};

export const updateTranscriptText = async (
  id: number,
  text: string
) => {
  const { error } = await supabase
    .from('transcripts')
    .update({
      original_text: text,
      status: 'corrected'
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to update transcript text:', error);
  }
};

export const processAudioFile = async (
  file: File,
  options: DeepgramOptions
): Promise<string> => {
  // Convert file to base64
  const base64Content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('transcribe', {
    body: {
      audioData: base64Content,
      fileName: file.name,
      options
    }
  });

  if (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }

  if (!data?.transcript) {
    throw new Error("No transcript received from processing");
  }

  return data.transcript;
};
