export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      document_texts: {
        Row: {
          content_type: string
          created_at: string | null
          extracted_text: string | null
          file_name: string
          file_path: string
          id: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          id?: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          id?: string
        }
        Relationships: []
      }
      training_rules: {
        Row: {
          correction: string
          created_at: string | null
          description: string | null
          general_instructions: Json | null
          id: string
          pattern: string
          type: Database["public"]["Enums"]["rule_type"]
        }
        Insert: {
          correction: string
          created_at?: string | null
          description?: string | null
          general_instructions?: Json | null
          id?: string
          pattern: string
          type: Database["public"]["Enums"]["rule_type"]
        }
        Update: {
          correction?: string
          created_at?: string | null
          description?: string | null
          general_instructions?: Json | null
          id?: string
          pattern?: string
          type?: Database["public"]["Enums"]["rule_type"]
        }
        Relationships: []
      }
      transcription_data: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          metadata: Json | null
          raw_response: Json | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          metadata?: Json | null
          raw_response?: Json | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          metadata?: Json | null
          raw_response?: Json | null
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          audio_url: string | null
          confidence_scores: Json | null
          corrected_text: string | null
          created_at: string | null
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          original_text: string
          processing_duration: number | null
          status: Database["public"]["Enums"]["file_status"] | null
          words: Json | null
        }
        Insert: {
          audio_url?: string | null
          confidence_scores?: Json | null
          corrected_text?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          original_text: string
          processing_duration?: number | null
          status?: Database["public"]["Enums"]["file_status"] | null
          words?: Json | null
        }
        Update: {
          audio_url?: string | null
          confidence_scores?: Json | null
          corrected_text?: string | null
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          original_text?: string
          processing_duration?: number | null
          status?: Database["public"]["Enums"]["file_status"] | null
          words?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      file_status:
        | "pending"
        | "processing"
        | "corrected"
        | "approved"
        | "rejected"
      rule_type:
        | "spelling"
        | "grammar"
        | "punctuation"
        | "formatting"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
