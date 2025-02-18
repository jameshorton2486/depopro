
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { TrainingRule, Transcript } from '@/types/supabase';

export async function saveTrainingRule(rule: Omit<TrainingRule, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('training_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    toast.success('Training rule saved successfully');
    return data;
  } catch (error) {
    console.error('Error saving training rule:', error);
    toast.error('Failed to save training rule');
    return null;
  }
}

export async function saveTranscript(transcript: Omit<Transcript, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('transcripts')
      .insert(transcript)
      .select()
      .single();

    if (error) throw error;
    toast.success('Transcript saved successfully');
    return data;
  } catch (error) {
    console.error('Error saving transcript:', error);
    toast.error('Failed to save transcript');
    return null;
  }
}

export async function updateTranscriptStatus(id: string, status: Transcript['status']) {
  try {
    const { error } = await supabase
      .from('transcripts')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    toast.success('Transcript status updated');
    return true;
  } catch (error) {
    console.error('Error updating transcript status:', error);
    toast.error('Failed to update transcript status');
    return false;
  }
}
