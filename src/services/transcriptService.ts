
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

export const createTranscriptRecord = async (
  file: File,
  userId: string
) => {
  console.debug('Creating transcript record:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    userId
  });

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
    console.error('Failed to create transcript record:', error);
    throw new Error(`Failed to create transcript record: ${error.message}`);
  }

  console.debug('Transcript record created successfully:', data);
  return data;
};

export const updateTranscriptStatus = async (
  id: string,
  status: 'processing' | 'corrected'
) => {
  console.debug('Updating transcript status:', { id, status });

  const { error } = await supabase
    .from('transcripts')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error(`Failed to update transcript status to ${status}:`, error);
  } else {
    console.debug('Transcript status updated successfully');
  }
};

export const updateTranscriptText = async (
  id: string,
  text: string
) => {
  console.debug('Updating transcript text:', { id, textLength: text.length });

  const { error } = await supabase
    .from('transcripts')
    .update({
      original_text: text,
      status: 'corrected'
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to update transcript text:', error);
  } else {
    console.debug('Transcript text updated successfully');
  }
};

export const processAudioFile = async (
  file: File,
  options: DeepgramOptions
): Promise<string> => {
  console.debug('Processing audio file:', {
    fileName: file.name,
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    options
  });

  // Ensure required formatting options are enabled
  const processOptions = {
    ...options,
    smart_format: true,
    punctuate: true,
    paragraphs: true
  };

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

  console.debug('File converted to base64, calling transcribe function with options:', processOptions);

  // Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('transcribe', {
    body: {
      audioData: base64Content,
      fileName: file.name,
      options: processOptions
    }
  });

  if (error) {
    console.error('Transcription failed:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }

  if (!data?.transcript) {
    console.error('No transcript received:', data);
    throw new Error("No transcript received from processing");
  }

  console.debug('Audio processing completed successfully');
  return data.transcript;
};
