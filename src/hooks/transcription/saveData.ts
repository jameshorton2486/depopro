
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions, TranscriptionResult, DeepgramParagraph } from "@/types/deepgram";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface EnableRealtimeParams {
  table_name: string;
}

interface EnableRealtimeResponse {
  success: boolean;
}

const convertParagraphToJson = (paragraph: DeepgramParagraph): Json => ({
  speaker: paragraph.speaker,
  start: paragraph.start,
  end: paragraph.end,
  sentences: paragraph.sentences.map(sentence => ({
    text: sentence.text,
    start: sentence.start,
    end: sentence.end
  }))
});

export const saveTranscriptionData = async (
  file: File,
  result: TranscriptionResult,
  audioPath: string,
  jsonPath: string,
  options: DeepgramOptions
) => {
  try {
    const jsonResult: Json = {
      transcript: result.transcript,
      paragraphs: result.paragraphs?.map(convertParagraphToJson) || [],
      metadata: {
        processingTime: result.metadata?.processingTime,
        audioLength: result.metadata?.audioLength,
        speakers: result.metadata?.speakers,
        fillerWords: result.metadata?.fillerWords
      }
    };

    console.log('Saving transcription data:', { file_name: file.name, audioPath, jsonPath });

    const { error: jsonError } = await supabase.storage
      .from('json_file')
      .upload(jsonPath, JSON.stringify(jsonResult, null, 2), {
        contentType: 'application/json',
        upsert: false
      });

    if (jsonError) throw jsonError;

    // Enable REPLICA IDENTITY FULL for the table to support realtime
    const { error: rpcError } = await supabase.rpc<EnableRealtimeResponse, EnableRealtimeParams>(
      'enable_realtime',
      { table_name: 'transcription_data' }
    );

    if (rpcError) throw rpcError;

    const { error: dbError } = await supabase
      .from('transcription_data')
      .insert({
        file_name: file.name,
        file_path: audioPath,
        metadata: {
          duration: result.metadata?.audioLength,
          speakers: result.metadata?.speakers,
          model: options.model,
          language: options.language,
          jsonPath: jsonPath
        } as Json,
        raw_response: jsonResult
      });

    if (dbError) throw dbError;
    toast.success('Transcription and data saved successfully');
  } catch (error) {
    console.error('Error saving transcription:', error);
    toast.error('Failed to save transcription data');
    throw error;
  }
};
