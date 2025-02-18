
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FileStatus = 'pending' | 'processing' | 'corrected' | 'approved' | 'rejected'
export type RuleType = 'spelling' | 'grammar' | 'punctuation' | 'formatting' | 'custom'

export interface TrainingRule {
  id: string
  created_at: string
  type: RuleType
  pattern: string
  correction: string
  description: string | null
  general_instructions: Json | null
}

export interface Transcript {
  id: string
  created_at: string
  name: string
  original_text: string
  corrected_text: string | null
  audio_url: string | null
  words: Json | null
  status: FileStatus
  confidence_scores: Json | null
  file_size: number | null
  file_type: string | null
  processing_duration: number | null
}

export type Database = {
  public: {
    Tables: {
      training_rules: {
        Row: TrainingRule
        Insert: Omit<TrainingRule, 'id' | 'created_at'>
        Update: Partial<Omit<TrainingRule, 'id' | 'created_at'>>
      }
      transcripts: {
        Row: Transcript
        Insert: Omit<Transcript, 'id' | 'created_at'>
        Update: Partial<Omit<Transcript, 'id' | 'created_at'>>
      }
    }
  }
}
