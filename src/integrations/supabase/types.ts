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
        ]
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
          diamonds_total: number | null
          event_ts: string
          gift_catalog_id: string | null
          id: string
          live_session_id: string | null
          quantity: number
          streamer_account_id: string
          viewer_identity_id: string
        }
        Insert: {
          diamonds_total?: number | null
          event_ts: string
          gift_catalog_id?: string | null
          id?: string
          live_session_id?: string | null
          quantity?: number
          streamer_account_id: string
          viewer_identity_id: string
        }
        Update: {
          diamonds_total?: number | null
          event_ts?: string
          gift_catalog_id?: string | null
          id?: string
          live_session_id?: string | null
          quantity?: number
          streamer_account_id?: string
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
            foreignKeyName: "gift_events_viewer_identity_id_fkey"
            columns: ["viewer_identity_id"]
            isOneToOne: false
            referencedRelation: "platform_identities"
            referencedColumns: ["id"]
          },
        ]
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
          region: string | null
          telegram_username: string | null
          tiktok_avatar_url: string | null
          tiktok_bio: string | null
          tiktok_followers: number | null
          tiktok_last_sync_at: string | null
          tiktok_nickname: string | null
          tiktok_username: string | null
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
          region?: string | null
          telegram_username?: string | null
          tiktok_avatar_url?: string | null
          tiktok_bio?: string | null
          tiktok_followers?: number | null
          tiktok_last_sync_at?: string | null
          tiktok_nickname?: string | null
          tiktok_username?: string | null
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
          region?: string | null
          telegram_username?: string | null
          tiktok_avatar_url?: string | null
          tiktok_bio?: string | null
          tiktok_followers?: number | null
          tiktok_last_sync_at?: string | null
          tiktok_nickname?: string | null
          tiktok_username?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
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
        ]
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
    }
    Views: {
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
      apply_xp_to_user_stats: {
        Args: { p_user_id: string; p_xp_gain: number }
        Returns: {
          level: number
          xp: number
          xp_to_next: number
        }[]
      }
      can_access_streamer: { Args: { _streamer_id: string }; Returns: boolean }
      ensure_profile_access_data: {
        Args: never
        Returns: {
          referral_code: string
          role: string
        }[]
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
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_public_role: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
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
      app_role:
        | "streamer"
        | "curator"
        | "manager"
        | "admin"
        | "investor"
        | "support"
        | "moderator"
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
      link_type_t: "owner" | "managed" | "member"
      live_status_t: "active" | "ended"
      member_status_t: "active" | "invited" | "removed"
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
      role_visibility: "public" | "internal"
      streamer_member_role_t:
        | "streamer_owner"
        | "agency_manager"
        | "editor"
        | "viewer_analyst"
      tiktok_sync_status: "pending" | "running" | "success" | "failed"
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
      app_role: [
        "streamer",
        "curator",
        "manager",
        "admin",
        "investor",
        "support",
        "moderator",
      ],
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
      link_type_t: ["owner", "managed", "member"],
      live_status_t: ["active", "ended"],
      member_status_t: ["active", "invited", "removed"],
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
      role_visibility: ["public", "internal"],
      streamer_member_role_t: [
        "streamer_owner",
        "agency_manager",
        "editor",
        "viewer_analyst",
      ],
      tiktok_sync_status: ["pending", "running", "success", "failed"],
      update_channel_t: ["stable", "beta"],
    },
  },
} as const
