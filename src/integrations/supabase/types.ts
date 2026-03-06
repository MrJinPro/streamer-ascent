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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["academy_block_type_t"]
          content: Json
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          required: boolean
          title: string | null
          updated_at: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["academy_block_type_t"]
          content?: Json
          created_at?: string
          id?: string
          lesson_id: string
          order_index?: number
          required?: boolean
          title?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["academy_block_type_t"]
          content?: Json
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          required?: boolean
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: number
          id: string
          is_published: boolean
          order_index: number
          required_level: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          is_published?: boolean
          order_index?: number
          required_level?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          id?: string
          is_published?: boolean
          order_index?: number
          required_level?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "academy_courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_generated_tasks: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          status: string
          title: string
          user_id: string
          verification_payload: Json
          verification_type: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          status?: string
          title: string
          user_id: string
          verification_payload?: Json
          verification_type?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          status?: string
          title?: string
          user_id?: string
          verification_payload?: Json
          verification_type?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_generated_tasks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_generated_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "academy_generated_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_lessons: {
        Row: {
          course_id: string
          created_at: string
          difficulty: number
          estimated_minutes: number
          id: string
          is_published: boolean
          order_index: number
          required_video_percent: number
          reward_meta: Json
          summary: string | null
          task_template: Json
          title: string
          updated_at: string
          xp_base: number
        }
        Insert: {
          course_id: string
          created_at?: string
          difficulty?: number
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          order_index?: number
          required_video_percent?: number
          reward_meta?: Json
          summary?: string | null
          task_template?: Json
          title: string
          updated_at?: string
          xp_base?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          difficulty?: number
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          order_index?: number
          required_video_percent?: number
          reward_meta?: Json
          summary?: string | null
          task_template?: Json
          title?: string
          updated_at?: string
          xp_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_xp_award_at: string | null
          lesson_id: string
          quiz_score: number | null
          started_at: string
          status: string
          task_completed: boolean
          updated_at: string
          user_id: string
          video_progress_percent: number
          video_seconds: number
          watch_seconds: number
          xp_awarded: number
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_xp_award_at?: string | null
          lesson_id: string
          quiz_score?: number | null
          started_at?: string
          status?: string
          task_completed?: boolean
          updated_at?: string
          user_id: string
          video_progress_percent?: number
          video_seconds?: number
          watch_seconds?: number
          xp_awarded?: number
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_xp_award_at?: string | null
          lesson_id?: string
          quiz_score?: number | null
          started_at?: string
          status?: string
          task_completed?: boolean
          updated_at?: string
          user_id?: string
          video_progress_percent?: number
          video_seconds?: number
          watch_seconds?: number
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "academy_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          passing_score: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          passing_score?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          passing_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_rewards: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          reward_type: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          reward_type: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          reward_type?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "academy_rewards_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_user_activity: {
        Row: {
          activity_date: string
          created_at: string
          engagement_score: number
          id: string
          lessons_completed: number
          stream_minutes: number
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          activity_date: string
          created_at?: string
          engagement_score?: number
          id?: string
          lessons_completed?: number
          stream_minutes?: number
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          activity_date?: string
          created_at?: string
          engagement_score?: number
          id?: string
          lessons_completed?: number
          stream_minutes?: number
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "academy_user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_claims: {
        Row: {
          achievement_id: string
          id: string
          note: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot: Json
          status: Database["public"]["Enums"]["achievement_claim_status_t"]
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          note?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["achievement_claim_status_t"]
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          note?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["achievement_claim_status_t"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          numeric_value: number | null
          occurred_at: string
          payload: Json
          source: string
          stream_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          numeric_value?: number | null
          occurred_at?: string
          payload?: Json
          source?: string
          stream_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          numeric_value?: number | null
          occurred_at?: string
          payload?: Json
          source?: string
          stream_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_progress: {
        Row: {
          achievement_id: string
          grant_mode: string
          last_event_at: string | null
          progress_type: Database["public"]["Enums"]["achievement_progress_type_t"]
          progress_value: number
          rule: Json
          status: Database["public"]["Enums"]["achievement_status_t"]
          target_value: number
          unlocked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          grant_mode?: string
          last_event_at?: string | null
          progress_type?: Database["public"]["Enums"]["achievement_progress_type_t"]
          progress_value?: number
          rule?: Json
          status?: Database["public"]["Enums"]["achievement_status_t"]
          target_value?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          grant_mode?: string
          last_event_at?: string | null
          progress_type?: Database["public"]["Enums"]["achievement_progress_type_t"]
          progress_value?: number
          rule?: Json
          status?: Database["public"]["Enums"]["achievement_status_t"]
          target_value?: number
          unlocked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_unlocks: {
        Row: {
          achievement_id: string
          admin_id: string | null
          id: string
          note: string | null
          snapshot: Json
          source: Database["public"]["Enums"]["achievement_unlock_source_t"]
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          admin_id?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          source: Database["public"]["Enums"]["achievement_unlock_source_t"]
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          admin_id?: string | null
          id?: string
          note?: string | null
          snapshot?: Json
          source?: Database["public"]["Enums"]["achievement_unlock_source_t"]
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_unlocks_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_unlocks_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "achievement_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_actions: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at: string
          id: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invite_link: string | null
          invite_token: string | null
          inviter_user_id: string | null
          metadata: Json
          referral_code: string | null
          role_slugs: string[]
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invite_link?: string | null
          invite_token?: string | null
          inviter_user_id?: string | null
          metadata?: Json
          referral_code?: string | null
          role_slugs?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invite_link?: string | null
          invite_token?: string | null
          inviter_user_id?: string | null
          metadata?: Json
          referral_code?: string | null
          role_slugs?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_invites_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_join_applications: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          motivation: string | null
          status: string
          stream_experience: string | null
          telegram: string | null
          tiktok_username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          motivation?: string | null
          status?: string
          stream_experience?: string | null
          telegram?: string | null
          tiktok_username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          motivation?: string | null
          status?: string
          stream_experience?: string | null
          telegram?: string | null
          tiktok_username?: string
        }
        Relationships: []
      }
      agency_referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          note: string | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          note?: string | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          note?: string | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "agency_referral_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agency_referral_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_referral_usages: {
        Row: {
          code_id: string
          created_at: string
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          code_id: string
          created_at?: string
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          code_id?: string
          created_at?: string
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_referral_usages_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "agency_referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_api_keys: {
        Row: {
          alias: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          provider: string
          secret_value: string
          updated_at: string
        }
        Insert: {
          alias: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          provider: string
          secret_value: string
          updated_at?: string
        }
        Update: {
          alias?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          provider?: string
          secret_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_logs: {
        Row: {
          completion_tokens: number | null
          cost_usd: number | null
          created_at: string
          feedback: number | null
          id: string
          latency_ms: number | null
          mode_id: string
          model: string | null
          prompt_text: string
          prompt_tokens: number | null
          provider: string | null
          response_text: string | null
          router_confidence: number | null
          router_reason: string | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          feedback?: number | null
          id?: string
          latency_ms?: number | null
          mode_id: string
          model?: string | null
          prompt_text: string
          prompt_tokens?: number | null
          provider?: string | null
          response_text?: string | null
          router_confidence?: number | null
          router_reason?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_usd?: number | null
          created_at?: string
          feedback?: number | null
          id?: string
          latency_ms?: number | null
          mode_id?: string
          model?: string | null
          prompt_text?: string
          prompt_tokens?: number | null
          provider?: string | null
          response_text?: string | null
          router_confidence?: number | null
          router_reason?: string | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_coach_auto_advices: {
        Row: {
          advice_text: string | null
          created_at: string
          error_text: string | null
          generated_at: string | null
          id: string
          is_read: boolean
          mode_id: string
          prompt_text: string
          status: string
          stream_session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advice_text?: string | null
          created_at?: string
          error_text?: string | null
          generated_at?: string | null
          id?: string
          is_read?: boolean
          mode_id?: string
          prompt_text: string
          status?: string
          stream_session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advice_text?: string | null
          created_at?: string
          error_text?: string | null
          generated_at?: string | null
          id?: string
          is_read?: boolean
          mode_id?: string
          prompt_text?: string
          status?: string
          stream_session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coach_live_alerts: {
        Row: {
          alert_text: string | null
          alert_type: string
          created_at: string
          donor_username: string
          error_text: string | null
          generated_at: string | null
          id: string
          is_read: boolean
          metadata: Json
          priority: string
          prompt_text: string
          status: string
          stream_session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_text?: string | null
          alert_type?: string
          created_at?: string
          donor_username: string
          error_text?: string | null
          generated_at?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          priority?: string
          prompt_text: string
          status?: string
          stream_session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_text?: string | null
          alert_type?: string
          created_at?: string
          donor_username?: string
          error_text?: string | null
          generated_at?: string | null
          id?: string
          is_read?: boolean
          metadata?: Json
          priority?: string
          prompt_text?: string
          status?: string
          stream_session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_coach_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value_json: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Relationships: []
      }
      ai_modes: {
        Row: {
          allowed_tools: Json
          cost_limit_daily_usd: number
          created_at: string
          data_requirements: Json
          enabled: boolean
          id: string
          key_alias: string | null
          max_tokens: number
          model: string
          provider: string
          rate_limit_per_minute: number
          style_guide: string | null
          system_prompt: string
          temperature: number
          updated_at: string
        }
        Insert: {
          allowed_tools?: Json
          cost_limit_daily_usd?: number
          created_at?: string
          data_requirements?: Json
          enabled?: boolean
          id: string
          key_alias?: string | null
          max_tokens?: number
          model: string
          provider?: string
          rate_limit_per_minute?: number
          style_guide?: string | null
          system_prompt: string
          temperature?: number
          updated_at?: string
        }
        Update: {
          allowed_tools?: Json
          cost_limit_daily_usd?: number
          created_at?: string
          data_requirements?: Json
          enabled?: boolean
          id?: string
          key_alias?: string | null
          max_tokens?: number
          model?: string
          provider?: string
          rate_limit_per_minute?: number
          style_guide?: string | null
          system_prompt?: string
          temperature?: number
          updated_at?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          last_used_at: string | null
          revoked: boolean
          streamer_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          streamer_id: string
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          revoked?: boolean
          streamer_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "api_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_tokens_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      app_content: {
        Row: {
          key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          key: string
          payload: Json
          updated_at?: string
        }
        Update: {
          key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      chat_message_exclusions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_exclusions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_internal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_message_exclusions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_receipts: {
        Row: {
          delivered_at: string
          id: string
          message_id: string
          read_at: string | null
          recipient_user_id: string
        }
        Insert: {
          delivered_at?: string
          id?: string
          message_id: string
          read_at?: string | null
          recipient_user_id: string
        }
        Update: {
          delivered_at?: string
          id?: string
          message_id?: string
          read_at?: string | null
          recipient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages_internal"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_receipts_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_message_receipts_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          event_ts: string
          id: string
          live_session_id: string | null
          message_text: string
          streamer_account_id: string
          viewer_identity_id: string
        }
        Insert: {
          event_ts: string
          id?: string
          live_session_id?: string | null
          message_text: string
          streamer_account_id: string
          viewer_identity_id: string
        }
        Update: {
          event_ts?: string
          id?: string
          live_session_id?: string | null
          message_text?: string
          streamer_account_id?: string
          viewer_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_viewer_identity_id_fkey"
            columns: ["viewer_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages_internal: {
        Row: {
          created_at: string
          edited_at: string | null
          excluded_user_ids: string[]
          id: string
          message_text: string
          metadata: Json
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          edited_at?: string | null
          excluded_user_ids?: string[]
          id?: string
          message_text: string
          metadata?: Json
          sender_user_id: string
          thread_id: string
        }
        Update: {
          created_at?: string
          edited_at?: string | null
          excluded_user_ids?: string[]
          id?: string
          message_text?: string
          metadata?: Json
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_internal_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_internal_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_internal_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_thread_members: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          last_read_at: string | null
          member_role: Database["public"]["Enums"]["chat_member_role_t"]
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          member_role?: Database["public"]["Enums"]["chat_member_role_t"]
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          member_role?: Database["public"]["Enums"]["chat_member_role_t"]
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_thread_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_thread_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string | null
          direct_key: string | null
          id: string
          kind: Database["public"]["Enums"]["chat_thread_kind_t"]
          last_message_at: string | null
          last_message_text: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          direct_key?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["chat_thread_kind_t"]
          last_message_at?: string | null
          last_message_text?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string | null
          direct_key?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["chat_thread_kind_t"]
          last_message_at?: string | null
          last_message_text?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      configs: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_active: boolean
          name: string
          product: Database["public"]["Enums"]["product_t"]
          streamer_id: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean
          name?: string
          product: Database["public"]["Enums"]["product_t"]
          streamer_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_active?: boolean
          name?: string
          product?: Database["public"]["Enums"]["product_t"]
          streamer_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "configs_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      curator_streamer_assignments: {
        Row: {
          active: boolean
          assigned_by: string | null
          created_at: string
          curator_user_id: string
          id: string
          streamer_user_id: string
        }
        Insert: {
          active?: boolean
          assigned_by?: string | null
          created_at?: string
          curator_user_id: string
          id?: string
          streamer_user_id: string
        }
        Update: {
          active?: boolean
          assigned_by?: string | null
          created_at?: string
          curator_user_id?: string
          id?: string
          streamer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curator_streamer_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curator_streamer_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curator_streamer_assignments_curator_user_id_fkey"
            columns: ["curator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curator_streamer_assignments_curator_user_id_fkey"
            columns: ["curator_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curator_streamer_assignments_streamer_user_id_fkey"
            columns: ["streamer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "curator_streamer_assignments_streamer_user_id_fkey"
            columns: ["streamer_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          app_version: string | null
          created_at: string
          device_id: string | null
          device_name: string | null
          hwid: string | null
          id: string
          last_ip: unknown
          last_seen_at: string | null
          os_name: string | null
          os_version: string | null
          platform: Database["public"]["Enums"]["device_platform_t"]
          push_token: string | null
          streamer_id: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          hwid?: string | null
          id?: string
          last_ip?: unknown
          last_seen_at?: string | null
          os_name?: string | null
          os_version?: string | null
          platform?: Database["public"]["Enums"]["device_platform_t"]
          push_token?: string | null
          streamer_id?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          hwid?: string | null
          id?: string
          last_ip?: unknown
          last_seen_at?: string | null
          os_name?: string | null
          os_version?: string | null
          platform?: Database["public"]["Enums"]["device_platform_t"]
          push_token?: string | null
          streamer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_stats: {
        Row: {
          donor_username: string
          id: string
          last_30d_anchor: string | null
          last_30d_coins: number
          last_7d_anchor: string | null
          last_7d_coins: number
          streamer_id: string
          today_coins: number
          today_date: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date: string | null
        }
        Insert: {
          donor_username: string
          id: string
          last_30d_anchor?: string | null
          last_30d_coins: number
          last_7d_anchor?: string | null
          last_7d_coins: number
          streamer_id: string
          today_coins: number
          today_date?: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date?: string | null
        }
        Update: {
          donor_username?: string
          id?: string
          last_30d_anchor?: string | null
          last_30d_coins?: number
          last_7d_anchor?: string | null
          last_7d_coins?: number
          streamer_id?: string
          today_coins?: number
          today_date?: string | null
          total_coins?: number
          total_gifts?: number
          updated_at?: string
          yesterday_coins?: number
          yesterday_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_stats_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_stats_tt: {
        Row: {
          donor_username: string
          id: string
          last_30d_anchor: string | null
          last_30d_coins: number
          last_7d_anchor: string | null
          last_7d_coins: number
          streamer_tiktok_username: string
          today_coins: number
          today_date: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date: string | null
        }
        Insert: {
          donor_username: string
          id: string
          last_30d_anchor?: string | null
          last_30d_coins: number
          last_7d_anchor?: string | null
          last_7d_coins: number
          streamer_tiktok_username: string
          today_coins: number
          today_date?: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date?: string | null
        }
        Update: {
          donor_username?: string
          id?: string
          last_30d_anchor?: string | null
          last_30d_coins?: number
          last_7d_anchor?: string | null
          last_7d_coins?: number
          streamer_tiktok_username?: string
          today_coins?: number
          today_date?: string | null
          total_coins?: number
          total_gifts?: number
          updated_at?: string
          yesterday_coins?: number
          yesterday_date?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at: string
          id: string
          payload?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events_raw: {
        Row: {
          event_ts: string
          event_type: Database["public"]["Enums"]["event_type_t"]
          id: string
          ingest_ts: string
          payload: Json
          platform: Database["public"]["Enums"]["platform_t"]
          streamer_account_id: string
        }
        Insert: {
          event_ts: string
          event_type?: Database["public"]["Enums"]["event_type_t"]
          id?: string
          ingest_ts?: string
          payload: Json
          platform?: Database["public"]["Enums"]["platform_t"]
          streamer_account_id: string
        }
        Update: {
          event_ts?: string
          event_type?: Database["public"]["Enums"]["event_type_t"]
          id?: string
          ingest_ts?: string
          payload?: Json
          platform?: Database["public"]["Enums"]["platform_t"]
          streamer_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_raw_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_catalog: {
        Row: {
          diamond_value: number | null
          gift_id: string
          id: string
          image_url: string | null
          name: string
          platform: Database["public"]["Enums"]["platform_t"]
          updated_at: string
        }
        Insert: {
          diamond_value?: number | null
          gift_id: string
          id?: string
          image_url?: string | null
          name: string
          platform?: Database["public"]["Enums"]["platform_t"]
          updated_at?: string
        }
        Update: {
          diamond_value?: number | null
          gift_id?: string
          id?: string
          image_url?: string | null
          name?: string
          platform?: Database["public"]["Enums"]["platform_t"]
          updated_at?: string
        }
        Relationships: []
      }
      gift_events: {
        Row: {
          created_at: string | null
          day: string | null
          diamonds_total: number | null
          donor_username: string | null
          event_ts: string
          gift_catalog_id: string | null
          gift_coins: number | null
          gift_count: number | null
          gift_id: string | null
          gift_name: string | null
          id: string
          live_session_id: string | null
          quantity: number
          streamer_account_id: string
          streamer_id: string | null
          viewer_identity_id: string
        }
        Insert: {
          created_at?: string | null
          day?: string | null
          diamonds_total?: number | null
          donor_username?: string | null
          event_ts: string
          gift_catalog_id?: string | null
          gift_coins?: number | null
          gift_count?: number | null
          gift_id?: string | null
          gift_name?: string | null
          id?: string
          live_session_id?: string | null
          quantity?: number
          streamer_account_id: string
          streamer_id?: string | null
          viewer_identity_id: string
        }
        Update: {
          created_at?: string | null
          day?: string | null
          diamonds_total?: number | null
          donor_username?: string | null
          event_ts?: string
          gift_catalog_id?: string | null
          gift_coins?: number | null
          gift_count?: number | null
          gift_id?: string | null
          gift_name?: string | null
          id?: string
          live_session_id?: string | null
          quantity?: number
          streamer_account_id?: string
          streamer_id?: string | null
          viewer_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_events_gift_catalog_id_fkey"
            columns: ["gift_catalog_id"]
            isOneToOne: false
            referencedRelation: "gift_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_events_viewer_identity_id_fkey"
            columns: ["viewer_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_events_tt: {
        Row: {
          created_at: string
          day: string
          donor_username: string
          gift_coins: number
          gift_count: number
          gift_id: string | null
          gift_name: string | null
          id: string
          streamer_tiktok_username: string
        }
        Insert: {
          created_at: string
          day: string
          donor_username: string
          gift_coins: number
          gift_count: number
          gift_id?: string | null
          gift_name?: string | null
          id: string
          streamer_tiktok_username: string
        }
        Update: {
          created_at?: string
          day?: string
          donor_username?: string
          gift_coins?: number
          gift_count?: number
          gift_id?: string | null
          gift_name?: string | null
          id?: string
          streamer_tiktok_username?: string
        }
        Relationships: []
      }
      gift_rollup_daily: {
        Row: {
          day: string
          diamonds_total: number
          gift_catalog_id: string
          last_event_ts: string | null
          qty_total: number
          streamer_account_id: string
          viewer_identity_id: string
        }
        Insert: {
          day: string
          diamonds_total?: number
          gift_catalog_id: string
          last_event_ts?: string | null
          qty_total?: number
          streamer_account_id: string
          viewer_identity_id: string
        }
        Update: {
          day?: string
          diamonds_total?: number
          gift_catalog_id?: string
          last_event_ts?: string | null
          qty_total?: number
          streamer_account_id?: string
          viewer_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_rollup_daily_gift_catalog_id_fkey"
            columns: ["gift_catalog_id"]
            isOneToOne: false
            referencedRelation: "gift_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_rollup_daily_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_rollup_daily_viewer_identity_id_fkey"
            columns: ["viewer_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_links: {
        Row: {
          created_at: string
          id: string
          link_type: Database["public"]["Enums"]["link_type_t"]
          platform_identity_id: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          link_type?: Database["public"]["Enums"]["link_type_t"]
          platform_identity_id: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: Database["public"]["Enums"]["link_type_t"]
          platform_identity_id?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "identity_links_platform_identity_id_fkey"
            columns: ["platform_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "identity_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      license_checks: {
        Row: {
          app_version: string | null
          checked_at: string
          device_id: string | null
          device_platform:
            | Database["public"]["Enums"]["device_platform_t"]
            | null
          hwid: string | null
          id: string
          ip_address: unknown
          license_id: string | null
          license_key: string | null
          meta: Json
          status: string | null
          user_agent: string | null
        }
        Insert: {
          app_version?: string | null
          checked_at?: string
          device_id?: string | null
          device_platform?:
            | Database["public"]["Enums"]["device_platform_t"]
            | null
          hwid?: string | null
          id?: string
          ip_address?: unknown
          license_id?: string | null
          license_key?: string | null
          meta?: Json
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          app_version?: string | null
          checked_at?: string
          device_id?: string | null
          device_platform?:
            | Database["public"]["Enums"]["device_platform_t"]
            | null
          hwid?: string | null
          id?: string
          ip_address?: unknown
          license_id?: string | null
          license_key?: string | null
          meta?: Json
          status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_checks_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_devices: {
        Row: {
          bound_at: string
          device_id: string
          license_id: string
          revoked: boolean
        }
        Insert: {
          bound_at?: string
          device_id: string
          license_id: string
          revoked?: boolean
        }
        Update: {
          bound_at?: string
          device_id?: string
          license_id?: string
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "license_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "license_devices_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_keys: {
        Row: {
          devices_bound: number | null
          expires_at: string | null
          id: string
          issued_at: string
          key: string
          max_devices: number | null
          plan: string | null
          status: Database["public"]["Enums"]["licensestatus"]
          user_id: string | null
        }
        Insert: {
          devices_bound?: number | null
          expires_at?: string | null
          id: string
          issued_at: string
          key: string
          max_devices?: number | null
          plan?: string | null
          status: Database["public"]["Enums"]["licensestatus"]
          user_id?: string | null
        }
        Update: {
          devices_bound?: number | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          key?: string
          max_devices?: number | null
          plan?: string | null
          status?: Database["public"]["Enums"]["licensestatus"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          last_check_at: string | null
          license_key: string
          max_devices: number
          notes: string | null
          org_id: string | null
          plan: string
          product: Database["public"]["Enums"]["product_t"]
          status: Database["public"]["Enums"]["license_status_t"]
          streamer_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_check_at?: string | null
          license_key: string
          max_devices?: number
          notes?: string | null
          org_id?: string | null
          plan?: string
          product: Database["public"]["Enums"]["product_t"]
          status?: Database["public"]["Enums"]["license_status_t"]
          streamer_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          last_check_at?: string | null
          license_key?: string
          max_devices?: number
          notes?: string | null
          org_id?: string | null
          plan?: string
          product?: Database["public"]["Enums"]["product_t"]
          status?: Database["public"]["Enums"]["license_status_t"]
          streamer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "licenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "licenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["live_status_t"]
          streamer_account_id: string
          title: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["live_status_t"]
          streamer_account_id: string
          title?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["live_status_t"]
          streamer_account_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          asset_type: string
          content_type: string | null
          created_at: string
          filename: string | null
          id: string
          meta: Json
          org_id: string | null
          size_bytes: number | null
          streamer_id: string | null
          url: string
        }
        Insert: {
          asset_type: string
          content_type?: string | null
          created_at?: string
          filename?: string | null
          id?: string
          meta?: Json
          org_id?: string | null
          size_bytes?: number | null
          streamer_id?: string | null
          url: string
        }
        Update: {
          asset_type?: string
          content_type?: string | null
          created_at?: string
          filename?: string | null
          id?: string
          meta?: Json
          org_id?: string | null
          size_bytes?: number | null
          streamer_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_targets: {
        Row: {
          created_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          created_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_targets_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: Database["public"]["Enums"]["notificationaudience"]
          audience_value: string | null
          body: string
          created_at: string
          created_by_user_id: string | null
          dedupe_key: string | null
          ends_at: string | null
          id: string
          in_app_enabled: boolean | null
          level: Database["public"]["Enums"]["notificationlevel"]
          link: string | null
          push_enabled: boolean | null
          starts_at: string | null
          targeting: Json | null
          title: string
          type: Database["public"]["Enums"]["notificationtype"] | null
        }
        Insert: {
          audience: Database["public"]["Enums"]["notificationaudience"]
          audience_value?: string | null
          body: string
          created_at: string
          created_by_user_id?: string | null
          dedupe_key?: string | null
          ends_at?: string | null
          id: string
          in_app_enabled?: boolean | null
          level: Database["public"]["Enums"]["notificationlevel"]
          link?: string | null
          push_enabled?: boolean | null
          starts_at?: string | null
          targeting?: Json | null
          title: string
          type?: Database["public"]["Enums"]["notificationtype"] | null
        }
        Update: {
          audience?: Database["public"]["Enums"]["notificationaudience"]
          audience_value?: string | null
          body?: string
          created_at?: string
          created_by_user_id?: string | null
          dedupe_key?: string | null
          ends_at?: string | null
          id?: string
          in_app_enabled?: boolean | null
          level?: Database["public"]["Enums"]["notificationlevel"]
          link?: string | null
          push_enabled?: boolean | null
          starts_at?: string | null
          targeting?: Json | null
          title?: string
          type?: Database["public"]["Enums"]["notificationtype"] | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          org_id: string
          role: Database["public"]["Enums"]["org_role_t"]
          status: Database["public"]["Enums"]["member_status_t"]
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role_t"]
          status?: Database["public"]["Enums"]["member_status_t"]
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role_t"]
          status?: Database["public"]["Enums"]["member_status_t"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          type: Database["public"]["Enums"]["org_type_t"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          type?: Database["public"]["Enums"]["org_type_t"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          type?: Database["public"]["Enums"]["org_type_t"]
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          request_ip: string | null
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          request_ip?: string | null
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          request_ip?: string | null
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description_en: string | null
          description_ru: string | null
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      platform_identities: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_seen_at: string
          id: string
          kind: Database["public"]["Enums"]["identity_kind_t"]
          last_seen_at: string
          platform: Database["public"]["Enums"]["platform_t"]
          platform_user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["identity_kind_t"]
          last_seen_at?: string
          platform?: Database["public"]["Enums"]["platform_t"]
          platform_user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_seen_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["identity_kind_t"]
          last_seen_at?: string
          platform?: Database["public"]["Enums"]["platform_t"]
          platform_user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      policy_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          doc_id: string
          embedding: string | null
          id: string
          language: string
          region: string | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          doc_id: string
          embedding?: string | null
          id?: string
          language?: string
          region?: string | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          doc_id?: string
          embedding?: string | null
          id?: string
          language?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_chunks_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "policy_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_docs: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          language: string
          region: string | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          language?: string
          region?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          language?: string
          region?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_qna: {
        Row: {
          active: boolean
          answer: string
          created_at: string
          id: string
          language: string
          question: string
          region: string | null
          source_chunk_ids: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          created_at?: string
          id?: string
          language?: string
          question: string
          region?: string | null
          source_chunk_ids?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          created_at?: string
          id?: string
          language?: string
          question?: string
          region?: string | null
          source_chunk_ids?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string | null
          is_online: boolean
          language: string | null
          last_seen_at: string | null
          locale: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          onboarding_referral_code: string | null
          onboarding_source: string | null
          region: string | null
          telegram_username: string | null
          tiktok_avatar_url: string | null
          tiktok_bio: string | null
          tiktok_followers: number | null
          tiktok_last_sync_at: string | null
          tiktok_nickname: string | null
          tiktok_username: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          is_online?: boolean
          language?: string | null
          last_seen_at?: string | null
          locale?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_referral_code?: string | null
          onboarding_source?: string | null
          region?: string | null
          telegram_username?: string | null
          tiktok_avatar_url?: string | null
          tiktok_bio?: string | null
          tiktok_followers?: number | null
          tiktok_last_sync_at?: string | null
          tiktok_nickname?: string | null
          tiktok_username?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          is_online?: boolean
          language?: string | null
          last_seen_at?: string | null
          locale?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          onboarding_referral_code?: string | null
          onboarding_source?: string | null
          region?: string | null
          telegram_username?: string | null
          tiktok_avatar_url?: string | null
          tiktok_bio?: string | null
          tiktok_followers?: number | null
          tiktok_last_sync_at?: string | null
          tiktok_nickname?: string | null
          tiktok_username?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      push_device_tokens: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_seen_at: string | null
          platform: Database["public"]["Enums"]["pushplatform"]
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: string
          enabled: boolean
          id: string
          last_seen_at?: string | null
          platform: Database["public"]["Enums"]["pushplatform"]
          token: string
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_seen_at?: string | null
          platform?: Database["public"]["Enums"]["pushplatform"]
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description_en: string | null
          description_ru: string | null
          id: string
          is_system_role: boolean
          name: string
          slug: string
          tier: Database["public"]["Enums"]["access_tier"]
          visibility: Database["public"]["Enums"]["role_visibility"]
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          id?: string
          is_system_role?: boolean
          name: string
          slug: string
          tier?: Database["public"]["Enums"]["access_tier"]
          visibility?: Database["public"]["Enums"]["role_visibility"]
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          slug?: string
          tier?: Database["public"]["Enums"]["access_tier"]
          visibility?: Database["public"]["Enums"]["role_visibility"]
        }
        Relationships: []
      }
      sound_files: {
        Row: {
          bytes: number
          created_at: string
          duration_ms: number | null
          filename: string
          id: string
          kind: Database["public"]["Enums"]["soundtype"]
          url: string
          user_id: string
        }
        Insert: {
          bytes: number
          created_at: string
          duration_ms?: number | null
          filename: string
          id: string
          kind: Database["public"]["Enums"]["soundtype"]
          url: string
          user_id: string
        }
        Update: {
          bytes?: number
          created_at?: string
          duration_ms?: number | null
          filename?: string
          id?: string
          kind?: Database["public"]["Enums"]["soundtype"]
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      store_purchases: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          platform: Database["public"]["Enums"]["storeplatform"]
          product_id: string
          purchase_token: string | null
          raw: Json | null
          status: Database["public"]["Enums"]["storepurchasestatus"]
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at: string
          expires_at?: string | null
          id: string
          platform: Database["public"]["Enums"]["storeplatform"]
          product_id: string
          purchase_token?: string | null
          raw?: Json | null
          status: Database["public"]["Enums"]["storepurchasestatus"]
          transaction_id?: string | null
          updated_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          platform?: Database["public"]["Enums"]["storeplatform"]
          product_id?: string
          purchase_token?: string | null
          raw?: Json | null
          status?: Database["public"]["Enums"]["storepurchasestatus"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string
          status: string | null
          tiktok_username: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id: string
          started_at: string
          status?: string | null
          tiktok_username: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string | null
          tiktok_username?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_accounts: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          platform: Database["public"]["Enums"]["platform_t"]
          platform_identity_id: string
          streamer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          platform?: Database["public"]["Enums"]["platform_t"]
          platform_identity_id: string
          streamer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          platform?: Database["public"]["Enums"]["platform_t"]
          platform_identity_id?: string
          streamer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streamer_accounts_platform_identity_id_fkey"
            columns: ["platform_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streamer_accounts_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_members: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["streamer_member_role_t"]
          status: Database["public"]["Enums"]["member_status_t"]
          streamer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["streamer_member_role_t"]
          status?: Database["public"]["Enums"]["member_status_t"]
          streamer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["streamer_member_role_t"]
          status?: Database["public"]["Enums"]["member_status_t"]
          streamer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streamer_members_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streamer_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "streamer_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_stats: {
        Row: {
          id: string
          last_30d_anchor: string | null
          last_30d_coins: number
          last_7d_anchor: string | null
          last_7d_coins: number
          streamer_id: string
          today_coins: number
          today_date: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date: string | null
        }
        Insert: {
          id: string
          last_30d_anchor?: string | null
          last_30d_coins: number
          last_7d_anchor?: string | null
          last_7d_coins: number
          streamer_id: string
          today_coins: number
          today_date?: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date?: string | null
        }
        Update: {
          id?: string
          last_30d_anchor?: string | null
          last_30d_coins?: number
          last_7d_anchor?: string | null
          last_7d_coins?: number
          streamer_id?: string
          today_coins?: number
          today_date?: string | null
          total_coins?: number
          total_gifts?: number
          updated_at?: string
          yesterday_coins?: number
          yesterday_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streamer_stats_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_stats_tt: {
        Row: {
          id: string
          last_30d_anchor: string | null
          last_30d_coins: number
          last_7d_anchor: string | null
          last_7d_coins: number
          streamer_tiktok_username: string
          today_coins: number
          today_date: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date: string | null
        }
        Insert: {
          id: string
          last_30d_anchor?: string | null
          last_30d_coins: number
          last_7d_anchor?: string | null
          last_7d_coins: number
          streamer_tiktok_username: string
          today_coins: number
          today_date?: string | null
          total_coins: number
          total_gifts: number
          updated_at: string
          yesterday_coins: number
          yesterday_date?: string | null
        }
        Update: {
          id?: string
          last_30d_anchor?: string | null
          last_30d_coins?: number
          last_7d_anchor?: string | null
          last_7d_coins?: number
          streamer_tiktok_username?: string
          today_coins?: number
          today_date?: string | null
          total_coins?: number
          total_gifts?: number
          updated_at?: string
          yesterday_coins?: number
          yesterday_date?: string | null
        }
        Relationships: []
      }
      streamers: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          org_id: string | null
          primary_identity_id: string
          status: Database["public"]["Enums"]["member_status_t"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          org_id?: string | null
          primary_identity_id: string
          status?: Database["public"]["Enums"]["member_status_t"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          org_id?: string | null
          primary_identity_id?: string
          status?: Database["public"]["Enums"]["member_status_t"]
        }
        Relationships: [
          {
            foreignKeyName: "streamers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streamers_primary_identity_id_fkey"
            columns: ["primary_identity_id"]
            isOneToOne: true
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_profile_cache: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          fetched_at: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at: string
          display_name?: string | null
          fetched_at?: string | null
          id: string
          updated_at: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          fetched_at?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      tiktok_sync_logs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["tiktok_sync_status"]
          user_id: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["tiktok_sync_status"]
          user_id: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["tiktok_sync_status"]
          user_id?: string
        }
        Relationships: []
      }
      triggers: {
        Row: {
          action: Database["public"]["Enums"]["triggeraction"]
          action_params: Json | null
          combo_count: number | null
          condition_key: string | null
          condition_value: string | null
          created_at: string
          enabled: boolean | null
          event_type: string
          executed_count: number | null
          id: string
          priority: number | null
          trigger_name: string | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["triggeraction"]
          action_params?: Json | null
          combo_count?: number | null
          condition_key?: string | null
          condition_value?: string | null
          created_at: string
          enabled?: boolean | null
          event_type: string
          executed_count?: number | null
          id: string
          priority?: number | null
          trigger_name?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["triggeraction"]
          action_params?: Json | null
          combo_count?: number | null
          condition_key?: string | null
          condition_value?: string | null
          created_at?: string
          enabled?: boolean | null
          event_type?: string
          executed_count?: number | null
          id?: string
          priority?: number | null
          trigger_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      updates: {
        Row: {
          changelog: string | null
          channel: Database["public"]["Enums"]["update_channel_t"]
          download_url: string
          id: string
          mandatory: boolean
          platform: Database["public"]["Enums"]["device_platform_t"]
          product: Database["public"]["Enums"]["product_t"]
          released_at: string
          version: string
        }
        Insert: {
          changelog?: string | null
          channel?: Database["public"]["Enums"]["update_channel_t"]
          download_url: string
          id?: string
          mandatory?: boolean
          platform: Database["public"]["Enums"]["device_platform_t"]
          product: Database["public"]["Enums"]["product_t"]
          released_at?: string
          version: string
        }
        Update: {
          changelog?: string | null
          channel?: Database["public"]["Enums"]["update_channel_t"]
          download_url?: string
          id?: string
          mandatory?: boolean
          platform?: Database["public"]["Enums"]["device_platform_t"]
          product?: Database["public"]["Enums"]["product_t"]
          released_at?: string
          version?: string
        }
        Relationships: []
      }
      user_achievement_pins: {
        Row: {
          achievement_id: string
          created_at: string
          position: number
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          position: number
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievement_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_achievement_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      user_legal_acceptances: {
        Row: {
          accepted: boolean
          accepted_at: string
          created_at: string
          document_type: string
          document_version: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string
          created_at?: string
          document_type: string
          document_version?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          created_at?: string
          document_type?: string
          document_version?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_legal_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_legal_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_users_unified"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          scope: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          scope?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          scope?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip: string | null
          platform: string | null
          region: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at: string
          id: string
          ip?: string | null
          platform?: string | null
          region?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string | null
          platform?: string | null
          region?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_connect_live: boolean
          chat_tts_min_diamonds: number
          chat_tts_mode: string
          chat_tts_prefixes: string
          gift_sounds_enabled: boolean | null
          gifts_volume: number | null
          id: string
          silence_enabled: boolean
          silence_minutes: number
          tts_enabled: boolean | null
          tts_volume: number | null
          user_id: string
          voice_id: string | null
        }
        Insert: {
          auto_connect_live?: boolean
          chat_tts_min_diamonds?: number
          chat_tts_mode?: string
          chat_tts_prefixes?: string
          gift_sounds_enabled?: boolean | null
          gifts_volume?: number | null
          id: string
          silence_enabled?: boolean
          silence_minutes?: number
          tts_enabled?: boolean | null
          tts_volume?: number | null
          user_id: string
          voice_id?: string | null
        }
        Update: {
          auto_connect_live?: boolean
          chat_tts_min_diamonds?: number
          chat_tts_mode?: string
          chat_tts_prefixes?: string
          gift_sounds_enabled?: boolean | null
          gifts_volume?: number | null
          id?: string
          silence_enabled?: boolean
          silence_minutes?: number
          tts_enabled?: boolean | null
          tts_volume?: number | null
          user_id?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tiktok_accounts: {
        Row: {
          created_at: string
          id: string
          last_used_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at: string
          id: string
          last_used_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tiktok_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_filename: string | null
          banned_at: string | null
          banned_reason: string | null
          created_at: string
          email: string | null
          id: string
          is_banned: boolean
          last_client_os: string | null
          last_client_platform: string | null
          last_device: string | null
          last_login_at: string | null
          last_login_ip: string | null
          last_user_agent: string | null
          last_ws_at: string | null
          password_hash: string
          region: string | null
          role: string
          supabase_uid: string | null
          tiktok_username: string | null
          username: string
        }
        Insert: {
          avatar_filename?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          created_at: string
          email?: string | null
          id: string
          is_banned?: boolean
          last_client_os?: string | null
          last_client_platform?: string | null
          last_device?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_user_agent?: string | null
          last_ws_at?: string | null
          password_hash: string
          region?: string | null
          role?: string
          supabase_uid?: string | null
          tiktok_username?: string | null
          username: string
        }
        Update: {
          avatar_filename?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_banned?: boolean
          last_client_os?: string | null
          last_client_platform?: string | null
          last_device?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_user_agent?: string | null
          last_ws_at?: string | null
          password_hash?: string
          region?: string | null
          role?: string
          supabase_uid?: string | null
          tiktok_username?: string | null
          username?: string
        }
        Relationships: []
      }
      viewer_rollup_daily: {
        Row: {
          day: string
          diamonds_total: number
          gifts_count: number
          last_chat_at: string | null
          last_gift_at: string | null
          streamer_account_id: string
          viewer_identity_id: string
        }
        Insert: {
          day: string
          diamonds_total?: number
          gifts_count?: number
          last_chat_at?: string | null
          last_gift_at?: string | null
          streamer_account_id: string
          viewer_identity_id: string
        }
        Update: {
          day?: string
          diamonds_total?: number
          gifts_count?: number
          last_chat_at?: string | null
          last_gift_at?: string | null
          streamer_account_id?: string
          viewer_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewer_rollup_daily_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_rollup_daily_viewer_identity_id_fkey"
            columns: ["viewer_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      viewer_streamer_stats: {
        Row: {
          diamonds_total: number
          first_seen_at: string | null
          gifts_count: number
          last_chat_at: string | null
          last_gift_at: string | null
          last_seen_at: string | null
          streamer_account_id: string
          viewer_identity_id: string
        }
        Insert: {
          diamonds_total?: number
          first_seen_at?: string | null
          gifts_count?: number
          last_chat_at?: string | null
          last_gift_at?: string | null
          last_seen_at?: string | null
          streamer_account_id: string
          viewer_identity_id: string
        }
        Update: {
          diamonds_total?: number
          first_seen_at?: string | null
          gifts_count?: number
          last_chat_at?: string | null
          last_gift_at?: string | null
          last_seen_at?: string | null
          streamer_account_id?: string
          viewer_identity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewer_streamer_stats_streamer_account_id_fkey"
            columns: ["streamer_account_id"]
            isOneToOne: false
            referencedRelation: "streamer_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viewer_streamer_stats_viewer_identity_id_fkey"
            columns: ["viewer_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      web_purchases: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          license_key: string | null
          order_id: string
          plan: string | null
          ttl_days: number | null
        }
        Insert: {
          amount?: number | null
          created_at: string
          currency?: string | null
          email?: string | null
          id: string
          license_key?: string | null
          order_id: string
          plan?: string | null
          ttl_days?: number | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          license_key?: string | null
          order_id?: string
          plan?: string | null
          ttl_days?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      ai_api_keys_public: {
        Row: {
          alias: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          is_active: boolean | null
          provider: string | null
          secret_masked: string | null
          updated_at: string | null
        }
        Insert: {
          alias?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_active?: boolean | null
          provider?: string | null
          secret_masked?: never
          updated_at?: string | null
        }
        Update: {
          alias?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          is_active?: boolean | null
          provider?: string | null
          secret_masked?: never
          updated_at?: string | null
        }
        Relationships: []
      }
      v_investor_growth: {
        Row: {
          month: string | null
          new_users: number | null
        }
        Relationships: []
      }
      v_investor_kpi_monthly: {
        Row: {
          active_streamers: number | null
          month: string | null
          total_diamonds: number | null
          total_gifts: number | null
        }
        Relationships: []
      }
      v_users_unified: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string | null
          locale: string | null
          onboarding_completed: boolean | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string | null
          locale?: string | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string | null
          locale?: string | null
          onboarding_completed?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      academy_award_xp: {
        Args: { p_lesson_id: string }
        Returns: {
          granted_xp: number
          reason: string
        }[]
      }
      academy_calculate_xp: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: number
      }
      academy_confirm_task: {
        Args: { p_completed?: boolean; p_lesson_id: string }
        Returns: {
          completed_at: string | null
          id: string
          last_xp_award_at: string | null
          lesson_id: string
          quiz_score: number | null
          started_at: string
          status: string
          task_completed: boolean
          updated_at: string
          user_id: string
          video_progress_percent: number
          video_seconds: number
          watch_seconds: number
          xp_awarded: number
        }
        SetofOptions: {
          from: "*"
          to: "academy_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      academy_mark_video_progress: {
        Args: {
          p_lesson_id: string
          p_video_seconds: number
          p_watch_seconds: number
        }
        Returns: {
          completed_at: string | null
          id: string
          last_xp_award_at: string | null
          lesson_id: string
          quiz_score: number | null
          started_at: string
          status: string
          task_completed: boolean
          updated_at: string
          user_id: string
          video_progress_percent: number
          video_seconds: number
          watch_seconds: number
          xp_awarded: number
        }
        SetofOptions: {
          from: "*"
          to: "academy_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ai_build_user_context: {
        Args: { p_mode_id?: string; p_user_id: string }
        Returns: Json
      }
      ai_claim_pending_auto_advice: {
        Args: { p_user_id?: string }
        Returns: {
          advice_id: string
          created_at: string
          mode_id: string
          prompt_text: string
          stream_session_id: string
        }[]
      }
      ai_claim_pending_live_alert: {
        Args: { p_user_id?: string }
        Returns: {
          alert_id: string
          created_at: string
          donor_username: string
          priority: string
          prompt_text: string
          stream_session_id: string
        }[]
      }
      ai_coach_setting_number: {
        Args: { p_default: number; p_key: string }
        Returns: number
      }
      ai_complete_auto_advice: {
        Args: {
          p_advice_id: string
          p_advice_text?: string
          p_error?: string
          p_failed?: boolean
        }
        Returns: boolean
      }
      ai_complete_live_alert: {
        Args: {
          p_alert_id: string
          p_alert_text?: string
          p_error?: string
          p_failed?: boolean
        }
        Returns: boolean
      }
      ai_list_auto_advices: {
        Args: { p_limit?: number; p_only_unread?: boolean; p_user_id?: string }
        Returns: {
          advice_text: string
          created_at: string
          generated_at: string
          id: string
          is_read: boolean
          mode_id: string
          status: string
          stream_session_id: string
        }[]
      }
      ai_list_live_alerts: {
        Args: { p_limit?: number; p_only_unread?: boolean; p_user_id?: string }
        Returns: {
          alert_text: string
          alert_type: string
          created_at: string
          donor_username: string
          generated_at: string
          id: string
          is_read: boolean
          priority: string
          status: string
          stream_session_id: string
        }[]
      }
      ai_mark_auto_advice_read: {
        Args: { p_advice_id: string }
        Returns: boolean
      }
      ai_mark_live_alert_read: {
        Args: { p_alert_id: string }
        Returns: boolean
      }
      ai_modes_public: {
        Args: never
        Returns: {
          allowed_tools: Json
          cost_limit_daily_usd: number
          data_requirements: Json
          enabled: boolean
          id: string
          max_tokens: number
          model: string
          provider: string
          rate_limit_per_minute: number
          style_guide: string
          system_prompt: string
          temperature: number
        }[]
      }
      ai_notifications_feed: {
        Args: { p_limit?: number; p_only_unread?: boolean; p_user_id?: string }
        Returns: {
          body: string
          created_at: string
          is_read: boolean
          item_id: string
          item_kind: string
          priority: string
          title: string
        }[]
      }
      ai_notifications_mark_read: {
        Args: { p_item_id: string; p_item_kind: string }
        Returns: boolean
      }
      ai_notifications_unread_count: {
        Args: { p_user_id?: string }
        Returns: number
      }
      ai_policy_retrieve: {
        Args: {
          p_language?: string
          p_limit?: number
          p_query: string
          p_region?: string
        }
        Returns: {
          chunk_id: string
          doc_title: string
          excerpt: string
          score: number
          source_url: string
        }[]
      }
      ai_queue_live_donor_alert: {
        Args: {
          p_donor_username: string
          p_source?: string
          p_stream_session_id: string
          p_streamer_tiktok_username: string
          p_user_id: string
        }
        Returns: string
      }
      ai_route_intent: {
        Args: { p_forced_mode?: string; p_text: string }
        Returns: {
          clarification_question: string
          confidence: number
          mode_id: string
          reason: string
        }[]
      }
      ai_save_feedback: {
        Args: { p_feedback: number; p_log_id: string }
        Returns: boolean
      }
      ai_user_is_promising: { Args: { p_user_id: string }; Returns: boolean }
      apply_xp_to_user_stats: {
        Args: { p_user_id: string; p_xp_gain: number }
        Returns: {
          level: number
          xp: number
          xp_to_next: number
        }[]
      }
      approve_achievement_claim: {
        Args: { p_claim_id: string; p_note?: string }
        Returns: boolean
      }
      can_access_streamer: { Args: { _streamer_id: string }; Returns: boolean }
      chat_create_group: {
        Args: { p_member_ids: string[]; p_title: string }
        Returns: string
      }
      chat_ensure_profile_exists: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      chat_get_or_create_direct_thread: {
        Args: { p_target_user_id: string }
        Returns: string
      }
      chat_get_or_create_support_thread: { Args: never; Returns: string }
      chat_get_unread_counts: {
        Args: never
        Returns: {
          thread_id: string
          unread_count: number
        }[]
      }
      chat_is_support_role: { Args: { p_user_id: string }; Returns: boolean }
      chat_mark_thread_read: { Args: { p_thread_id: string }; Returns: number }
      chat_resolve_member_user_id: {
        Args: { p_input_user_id: string }
        Returns: string
      }
      chat_resolve_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      chat_send_message: {
        Args: {
          p_excluded_user_ids?: string[]
          p_text: string
          p_thread_id: string
        }
        Returns: {
          created_at: string
          edited_at: string | null
          excluded_user_ids: string[]
          id: string
          message_text: string
          metadata: Json
          sender_user_id: string
          thread_id: string
        }
        SetofOptions: {
          from: "*"
          to: "chat_messages_internal"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      chat_sync_support_memberships: {
        Args: { p_user_id?: string }
        Returns: number
      }
      chat_user_can_dm: {
        Args: { p_sender: string; p_target: string }
        Returns: boolean
      }
      chat_user_is_message_sender: {
        Args: { p_message_id: string; p_user_id: string }
        Returns: boolean
      }
      chat_user_is_thread_admin: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: boolean
      }
      chat_user_is_thread_member: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: boolean
      }
      compute_achievement_progress: {
        Args: {
          p_progress_type: Database["public"]["Enums"]["achievement_progress_type_t"]
          p_rule: Json
          p_target: number
          p_user_id: string
        }
        Returns: number
      }
      consume_referral_code: {
        Args: { p_code: string; p_email: string; p_user_id: string }
        Returns: boolean
      }
      ensure_profile_access_data: {
        Args: never
        Returns: {
          referral_code: string
          role: string
        }[]
      }
      get_achievement_catalog_item: {
        Args: { p_achievement_id: string }
        Returns: Json
      }
      get_achievement_grant_mode_from_item: {
        Args: { p_item: Json }
        Returns: string
      }
      get_achievement_progress_type_from_item: {
        Args: { p_item: Json }
        Returns: Database["public"]["Enums"]["achievement_progress_type_t"]
      }
      get_achievement_target_from_item: {
        Args: { p_item: Json }
        Returns: number
      }
      get_user_level_from_app_content: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_permissions: { Args: { _user_id: string }; Returns: string[] }
      get_user_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["access_tier"]
      }
      grant_user_achievement: {
        Args: { p_achievement_id: string; p_note?: string; p_user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_public_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: { Args: { _role: string }; Returns: boolean }
      has_role_in_scope: {
        Args: { _role: string; _scope_id: string }
        Returns: boolean
      }
      ingest_achievement_event: {
        Args: {
          p_event_type: string
          p_numeric_value?: number
          p_occurred_at?: string
          p_payload?: Json
          p_source?: string
          p_stream_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      insert_achievement_unlock: {
        Args: {
          p_achievement_id: string
          p_admin_id?: string
          p_note?: string
          p_snapshot?: Json
          p_source: Database["public"]["Enums"]["achievement_unlock_source_t"]
          p_user_id: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      map_role_slug_to_app_role: {
        Args: { p_slug: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      recompute_achievement_progress_all_users: { Args: never; Returns: Json }
      referral_code_is_valid: { Args: { p_code: string }; Returns: boolean }
      refresh_user_achievements: { Args: { p_user_id?: string }; Returns: Json }
      reject_achievement_claim: {
        Args: { p_claim_id: string; p_note?: string }
        Returns: boolean
      }
      resolve_mobile_user_id: {
        Args: { p_mobile_user_id: string }
        Returns: string
      }
      revoke_user_achievement: {
        Args: { p_achievement_id: string; p_note?: string; p_user_id: string }
        Returns: boolean
      }
      safe_app_role_from_text: {
        Args: { p_role: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      user_can_manage_users: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      academy_block_type_t:
        | "video"
        | "text"
        | "image"
        | "gallery"
        | "checklist"
        | "quiz"
        | "cta"
        | "reward"
        | "task"
      access_tier: "tier_0" | "tier_1" | "tier_2" | "tier_3" | "tier_4"
      achievement_claim_status_t: "pending" | "approved" | "rejected"
      achievement_progress_type_t:
        | "counter_total"
        | "sum_total"
        | "duration_total"
        | "max_in_single_session"
        | "sum_in_single_session"
        | "streak_days"
        | "time_window_sum"
        | "time_window_count"
        | "manual_only"
        | "verified_by_admin"
      achievement_status_t: "in_progress" | "unlocked" | "revoked"
      achievement_unlock_source_t: "auto" | "manual" | "verified"
      app_role:
        | "streamer"
        | "curator"
        | "manager"
        | "admin"
        | "investor"
        | "support"
        | "moderator"
      chat_member_role_t: "member" | "admin"
      chat_thread_kind_t: "direct" | "group" | "support"
      device_platform_t:
        | "ios"
        | "android"
        | "win32"
        | "darwin"
        | "linux"
        | "web"
        | "unknown"
      event_type_t:
        | "gift"
        | "chat"
        | "follow"
        | "like"
        | "share"
        | "subscribe"
        | "unknown"
      identity_kind_t: "unknown" | "viewer" | "streamer"
      license_status_t: "active" | "expired" | "banned" | "revoked"
      licensestatus: "active" | "inactive" | "revoked"
      link_type_t: "owner" | "managed" | "member"
      live_status_t: "active" | "ended"
      member_status_t: "active" | "invited" | "removed"
      notificationaudience: "all" | "users" | "plan" | "missing_email"
      notificationlevel: "info" | "warning" | "promo"
      notificationtype: "system" | "product" | "marketing"
      org_role_t:
        | "owner"
        | "admin"
        | "manager"
        | "support"
        | "dev"
        | "investor"
        | "moderator"
      org_type_t: "agency" | "streamer_team" | "solo"
      platform_t: "tiktok"
      product_t: "mobile" | "desktop" | "tools" | "overlays"
      pushplatform: "android" | "ios" | "web"
      role_visibility: "public" | "internal"
      soundtype: "uploaded" | "tts"
      storeplatform: "android" | "ios"
      storepurchasestatus: "active" | "expired" | "canceled" | "unknown"
      streamer_member_role_t:
        | "streamer_owner"
        | "agency_manager"
        | "editor"
        | "viewer_analyst"
      tiktok_sync_status: "pending" | "running" | "success" | "failed"
      triggeraction: "play_sound" | "tts"
      update_channel_t: "stable" | "beta"
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
      academy_block_type_t: [
        "video",
        "text",
        "image",
        "gallery",
        "checklist",
        "quiz",
        "cta",
        "reward",
        "task",
      ],
      access_tier: ["tier_0", "tier_1", "tier_2", "tier_3", "tier_4"],
      achievement_claim_status_t: ["pending", "approved", "rejected"],
      achievement_progress_type_t: [
        "counter_total",
        "sum_total",
        "duration_total",
        "max_in_single_session",
        "sum_in_single_session",
        "streak_days",
        "time_window_sum",
        "time_window_count",
        "manual_only",
        "verified_by_admin",
      ],
      achievement_status_t: ["in_progress", "unlocked", "revoked"],
      achievement_unlock_source_t: ["auto", "manual", "verified"],
      app_role: [
        "streamer",
        "curator",
        "manager",
        "admin",
        "investor",
        "support",
        "moderator",
      ],
      chat_member_role_t: ["member", "admin"],
      chat_thread_kind_t: ["direct", "group", "support"],
      device_platform_t: [
        "ios",
        "android",
        "win32",
        "darwin",
        "linux",
        "web",
        "unknown",
      ],
      event_type_t: [
        "gift",
        "chat",
        "follow",
        "like",
        "share",
        "subscribe",
        "unknown",
      ],
      identity_kind_t: ["unknown", "viewer", "streamer"],
      license_status_t: ["active", "expired", "banned", "revoked"],
      licensestatus: ["active", "inactive", "revoked"],
      link_type_t: ["owner", "managed", "member"],
      live_status_t: ["active", "ended"],
      member_status_t: ["active", "invited", "removed"],
      notificationaudience: ["all", "users", "plan", "missing_email"],
      notificationlevel: ["info", "warning", "promo"],
      notificationtype: ["system", "product", "marketing"],
      org_role_t: [
        "owner",
        "admin",
        "manager",
        "support",
        "dev",
        "investor",
        "moderator",
      ],
      org_type_t: ["agency", "streamer_team", "solo"],
      platform_t: ["tiktok"],
      product_t: ["mobile", "desktop", "tools", "overlays"],
      pushplatform: ["android", "ios", "web"],
      role_visibility: ["public", "internal"],
      soundtype: ["uploaded", "tts"],
      storeplatform: ["android", "ios"],
      storepurchasestatus: ["active", "expired", "canceled", "unknown"],
      streamer_member_role_t: [
        "streamer_owner",
        "agency_manager",
        "editor",
        "viewer_analyst",
      ],
      tiktok_sync_status: ["pending", "running", "success", "failed"],
      triggeraction: ["play_sound", "tts"],
      update_channel_t: ["stable", "beta"],
    },
  },
} as const
