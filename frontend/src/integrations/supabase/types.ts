export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      interview_attempts: {
        Row: {
          category: string
          clarity_score: number
          communication_score: number
          created_at: string | null
          difficulty: string
          feedback: string
          id: string
          question: string
          session_id: string
          technical_depth_score: number
          user_answer: string
        }
        Insert: {
          category: string
          clarity_score?: number
          communication_score?: number
          created_at?: string | null
          difficulty?: string
          feedback?: string
          id?: string
          question: string
          session_id: string
          technical_depth_score?: number
          user_answer: string
        }
        Update: {
          category?: string
          clarity_score?: number
          communication_score?: number
          created_at?: string | null
          difficulty?: string
          feedback?: string
          id?: string
          question?: string
          session_id?: string
          technical_depth_score?: number
          user_answer?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_date: string | null
          apply_url: string | null
          company: string
          created_at: string | null
          id: string
          job_id: string
          job_title: string
          job_type: string | null
          location: string
          match_score: number
          matching_skills: string[] | null
          missing_skills: string[] | null
          notes: string | null
          resume_version_id: string | null
          salary: string | null
          session_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string | null
        }
        Insert: {
          applied_date?: string | null
          apply_url?: string | null
          company: string
          created_at?: string | null
          id?: string
          job_id: string
          job_title: string
          job_type?: string | null
          location: string
          match_score?: number
          matching_skills?: string[] | null
          missing_skills?: string[] | null
          notes?: string | null
          resume_version_id?: string | null
          salary?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string | null
        }
        Update: {
          applied_date?: string | null
          apply_url?: string | null
          company?: string
          created_at?: string | null
          id?: string
          job_id?: string
          job_title?: string
          job_type?: string | null
          location?: string
          match_score?: number
          matching_skills?: string[] | null
          missing_skills?: string[] | null
          notes?: string | null
          resume_version_id?: string | null
          salary?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          experience_level: string | null
          id: string
          preferred_location: string | null
          preferred_role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          experience_level?: string | null
          id: string
          preferred_location?: string | null
          preferred_role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          experience_level?: string | null
          id?: string
          preferred_location?: string | null
          preferred_role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resume_versions: {
        Row: {
          analysis_data: Json | null
          application_strength: number | null
          created_at: string | null
          id: string
          is_original: boolean | null
          name: string
          optimized_bullet_points: Json | null
          optimized_skills: string[] | null
          optimized_summary: string | null
          parsed_resume: Json | null
          profile_data: Json
          raw_text: string | null
          session_id: string
          target_company: string | null
          target_job_title: string | null
        }
        Insert: {
          analysis_data?: Json | null
          application_strength?: number | null
          created_at?: string | null
          id?: string
          is_original?: boolean | null
          name: string
          optimized_bullet_points?: Json | null
          optimized_skills?: string[] | null
          optimized_summary?: string | null
          parsed_resume?: Json | null
          profile_data: Json
          raw_text?: string | null
          session_id: string
          target_company?: string | null
          target_job_title?: string | null
        }
        Update: {
          analysis_data?: Json | null
          application_strength?: number | null
          created_at?: string | null
          id?: string
          is_original?: boolean | null
          name?: string
          optimized_bullet_points?: Json | null
          optimized_skills?: string[] | null
          optimized_summary?: string | null
          parsed_resume?: Json | null
          profile_data?: Json
          raw_text?: string | null
          session_id?: string
          target_company?: string | null
          target_job_title?: string | null
        }
        Relationships: []
      }
      roadmap_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string | null
          id: string
          session_id: string
          step_index: number
          target_role: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          session_id: string
          step_index: number
          target_role: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string | null
          id?: string
          session_id?: string
          step_index?: number
          target_role?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          created_at: string | null
          id: string
          job_data: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_data: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_data?: Json
          session_id?: string
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
      application_status:
        | "saved"
        | "applied"
        | "interview"
        | "offer"
        | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "saved",
        "applied",
        "interview",
        "offer",
        "rejected",
      ],
    },
  },
} as const
