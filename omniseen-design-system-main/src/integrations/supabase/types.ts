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
      admin_team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          invited_by: string | null
          is_active: boolean | null
          last_login_at: string | null
          name: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          role?: string
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          agent_name: string
          article_id: string | null
          blog_id: string | null
          cost_usd: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          landing_page_id: string | null
          metadata: Json | null
          model_used: string | null
          pipeline_run_id: string | null
          pipeline_type: string
          status: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          agent_name: string
          article_id?: string | null
          blog_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          landing_page_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          pipeline_run_id?: string | null
          pipeline_type?: string
          status?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          agent_name?: string
          article_id?: string | null
          blog_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          landing_page_id?: string | null
          metadata?: Json | null
          model_used?: string | null
          pipeline_run_id?: string | null
          pipeline_type?: string
          status?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "landing_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_config: {
        Row: {
          fallback_model: string | null
          function_name: string
          id: string
          is_economy_mode: boolean | null
          is_premium_mode: boolean | null
          model_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          fallback_model?: string | null
          function_name: string
          id?: string
          is_economy_mode?: boolean | null
          is_premium_mode?: boolean | null
          model_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          fallback_model?: string | null
          function_name?: string
          id?: string
          is_economy_mode?: boolean | null
          is_premium_mode?: boolean | null
          model_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          blog_id: string
          created_at: string
          id: string
          model: string
          operation: string
          source: string
          tokens: number
        }
        Insert: {
          blog_id: string
          created_at?: string
          id?: string
          model?: string
          operation: string
          source: string
          tokens?: number
        }
        Update: {
          blog_id?: string
          created_at?: string
          id?: string
          model?: string
          operation?: string
          source?: string
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      article_content_scores: {
        Row: {
          article_id: string
          calculated_at: string
          created_at: string
          id: string
          issues: Json | null
          keyword_score: number
          meta_score: number
          overall_score: number
          readability_score: number
          recommendations: Json | null
          structure_score: number
        }
        Insert: {
          article_id: string
          calculated_at?: string
          created_at?: string
          id?: string
          issues?: Json | null
          keyword_score?: number
          meta_score?: number
          overall_score?: number
          readability_score?: number
          recommendations?: Json | null
          structure_score?: number
        }
        Update: {
          article_id?: string
          calculated_at?: string
          created_at?: string
          id?: string
          issues?: Json | null
          keyword_score?: number
          meta_score?: number
          overall_score?: number
          readability_score?: number
          recommendations?: Json | null
          structure_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_content_scores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_jobs: {
        Row: {
          article_id: string | null
          blog_id: string
          completed_at: string | null
          created_at: string | null
          current_step: string | null
          error_message: string | null
          id: string
          keyword: string
          pipeline_data: Json
          progress: number
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          article_id?: string | null
          blog_id: string
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          keyword: string
          pipeline_data?: Json
          progress?: number
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          article_id?: string | null
          blog_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          keyword?: string
          pipeline_data?: Json
          progress?: number
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_jobs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_jobs_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      article_opportunities: {
        Row: {
          blog_id: string
          converted_article_id: string | null
          created_at: string
          difficulty_estimate: number
          id: string
          intent: string
          primary_keyword: string
          recommended_type: string
          relevance_score: number
          secondary_keywords: string[]
          status: string
          suggested_title: string
          updated_at: string
        }
        Insert: {
          blog_id: string
          converted_article_id?: string | null
          created_at?: string
          difficulty_estimate?: number
          id?: string
          intent?: string
          primary_keyword: string
          recommended_type?: string
          relevance_score?: number
          secondary_keywords?: string[]
          status?: string
          suggested_title: string
          updated_at?: string
        }
        Update: {
          blog_id?: string
          converted_article_id?: string | null
          created_at?: string
          difficulty_estimate?: number
          id?: string
          intent?: string
          primary_keyword?: string
          recommended_type?: string
          relevance_score?: number
          secondary_keywords?: string[]
          status?: string
          suggested_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_opportunities_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      article_queue: {
        Row: {
          article_id: string | null
          attempts: number
          blog_id: string
          created_at: string
          id: string
          last_error: string | null
          opportunity_id: string | null
          priority: number
          scheduled_for: string
          status: string
          suggested_theme: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          attempts?: number
          blog_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          opportunity_id?: string | null
          priority?: number
          scheduled_for?: string
          status?: string
          suggested_theme: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          attempts?: number
          blog_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          opportunity_id?: string | null
          priority?: number
          scheduled_for?: string
          status?: string
          suggested_theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_queue_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_queue_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_queue_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "article_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          article_id: string
          content: string
          created_at: string
          id: string
          title: string
          version_number: number
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          version_number?: number
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string
          blog_id: string
          category: string | null
          content: string
          content_json: Json | null
          created_at: string
          engine: string
          excerpt: string
          faq: Json | null
          featured_image_url: string | null
          focus_keyword: string
          generation_job_id: string | null
          id: string
          is_generated_by_ai: boolean | null
          meta_description: string
          meta_title: string
          published_at: string | null
          reading_time_minutes: number
          scheduled_at: string | null
          secondary_keywords: string[]
          seo_score: number
          serp_data: Json | null
          slug: string
          source_opportunity_id: string | null
          source_queue_id: string | null
          status: string
          tags: string[]
          title: string
          updated_at: string
          word_count: number
        }
        Insert: {
          author?: string
          blog_id: string
          category?: string | null
          content?: string
          content_json?: Json | null
          created_at?: string
          engine?: string
          excerpt?: string
          faq?: Json | null
          featured_image_url?: string | null
          focus_keyword?: string
          generation_job_id?: string | null
          id?: string
          is_generated_by_ai?: boolean | null
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          reading_time_minutes?: number
          scheduled_at?: string | null
          secondary_keywords?: string[]
          seo_score?: number
          serp_data?: Json | null
          slug: string
          source_opportunity_id?: string | null
          source_queue_id?: string | null
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          word_count?: number
        }
        Update: {
          author?: string
          blog_id?: string
          category?: string | null
          content?: string
          content_json?: Json | null
          created_at?: string
          engine?: string
          excerpt?: string
          faq?: Json | null
          featured_image_url?: string | null
          focus_keyword?: string
          generation_job_id?: string | null
          id?: string
          is_generated_by_ai?: boolean | null
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          reading_time_minutes?: number
          scheduled_at?: string | null
          secondary_keywords?: string[]
          seo_score?: number
          serp_data?: Json | null
          slug?: string
          source_opportunity_id?: string | null
          source_queue_id?: string | null
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_generation_job_id_fkey"
            columns: ["generation_job_id"]
            isOneToOne: false
            referencedRelation: "article_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_automation: {
        Row: {
          articles_per_period: number
          auto_publish: boolean
          blog_id: string
          created_at: string
          frequency: string
          is_active: boolean
          last_run_at: string | null
          mode: string
          next_run_at: string | null
          preferred_time: string
          timezone: string
          updated_at: string
          web_research_enabled: boolean
        }
        Insert: {
          articles_per_period?: number
          auto_publish?: boolean
          blog_id: string
          created_at?: string
          frequency?: string
          is_active?: boolean
          last_run_at?: string | null
          mode?: string
          next_run_at?: string | null
          preferred_time?: string
          timezone?: string
          updated_at?: string
          web_research_enabled?: boolean
        }
        Update: {
          articles_per_period?: number
          auto_publish?: boolean
          blog_id?: string
          created_at?: string
          frequency?: string
          is_active?: boolean
          last_run_at?: string | null
          mode?: string
          next_run_at?: string | null
          preferred_time?: string
          timezone?: string
          updated_at?: string
          web_research_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "blog_automation_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: true
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_bio: string | null
          author_name: string | null
          author_role: string | null
          author_signature_enabled: boolean | null
          bairro: string | null
          brand_voice: string
          cep: string | null
          cidade: string | null
          created_at: string
          description: string
          endereco: string | null
          id: string
          image_style: string | null
          language: string
          name: string
          niche: string
          platform_subdomain: string
          segmento: string | null
          servicos_oferecidos: string | null
          slug: string
          target_audience: string
          tenant_id: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_bio?: string | null
          author_name?: string | null
          author_role?: string | null
          author_signature_enabled?: boolean | null
          bairro?: string | null
          brand_voice?: string
          cep?: string | null
          cidade?: string | null
          created_at?: string
          description?: string
          endereco?: string | null
          id?: string
          image_style?: string | null
          language?: string
          name: string
          niche?: string
          platform_subdomain?: string
          segmento?: string | null
          servicos_oferecidos?: string | null
          slug: string
          target_audience?: string
          tenant_id: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_bio?: string | null
          author_name?: string | null
          author_role?: string | null
          author_signature_enabled?: boolean | null
          bairro?: string | null
          brand_voice?: string
          cep?: string | null
          cidade?: string | null
          created_at?: string
          description?: string
          endereco?: string | null
          id?: string
          image_style?: string | null
          language?: string
          name?: string
          niche?: string
          platform_subdomain?: string
          segmento?: string | null
          servicos_oferecidos?: string | null
          slug?: string
          target_audience?: string
          tenant_id?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_agent_config: {
        Row: {
          agent_name: string
          blog_id: string
          created_at: string
          is_enabled: boolean
          primary_goal: string
          qualifying_questions: Json | null
          updated_at: string
          webhook_url: string | null
          welcome_message: string
          whatsapp_number: string | null
        }
        Insert: {
          agent_name?: string
          blog_id: string
          created_at?: string
          is_enabled?: boolean
          primary_goal?: string
          qualifying_questions?: Json | null
          updated_at?: string
          webhook_url?: string | null
          welcome_message?: string
          whatsapp_number?: string | null
        }
        Update: {
          agent_name?: string
          blog_id?: string
          created_at?: string
          is_enabled?: boolean
          primary_goal?: string
          qualifying_questions?: Json | null
          updated_at?: string
          webhook_url?: string | null
          welcome_message?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_agent_config_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: true
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_agent_leads: {
        Row: {
          blog_id: string
          conversation_id: string
          converted_at: string | null
          created_at: string
          deal_value: number | null
          email: string | null
          id: string
          interest_summary: string
          lead_score: number
          name: string
          phone: string | null
          pipeline_type: string | null
          segment: string | null
          source_article_id: string | null
          source_page_url: string
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          blog_id: string
          conversation_id: string
          converted_at?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          interest_summary?: string
          lead_score?: number
          name?: string
          phone?: string | null
          pipeline_type?: string | null
          segment?: string | null
          source_article_id?: string | null
          source_page_url?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          blog_id?: string
          conversation_id?: string
          converted_at?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          id?: string
          interest_summary?: string
          lead_score?: number
          name?: string
          phone?: string | null
          pipeline_type?: string | null
          segment?: string | null
          source_article_id?: string | null
          source_page_url?: string
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_agent_leads_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          brand_colors: Json
          brand_name: string
          brand_voice: string
          created_at: string
          id: string
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_colors?: Json
          brand_name?: string
          brand_voice?: string
          created_at?: string
          id?: string
          target_audience?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_colors?: Json
          brand_name?: string
          brand_voice?: string
          created_at?: string
          id?: string
          target_audience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cms_integrations: {
        Row: {
          auto_publish: boolean
          blog_id: string
          created_at: string
          credentials: Json
          id: string
          is_active: boolean
          last_sync_at: string | null
          platform: string
          site_url: string
          updated_at: string
        }
        Insert: {
          auto_publish?: boolean
          blog_id: string
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          platform: string
          site_url: string
          updated_at?: string
        }
        Update: {
          auto_publish?: boolean
          blog_id?: string
          created_at?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          platform?: string
          site_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_integrations_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_publish_logs: {
        Row: {
          article_id: string
          created_at: string
          error_message: string | null
          external_id: string | null
          external_url: string | null
          id: string
          integration_id: string
          status: string
        }
        Insert: {
          article_id: string
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          integration_id: string
          status: string
        }
        Update: {
          article_id?: string
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          external_url?: string | null
          id?: string
          integration_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_publish_logs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_publish_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "cms_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          blog_id: string
          content: string
          created_at: string
          focus_keyword: string
          id: string
          meta_description: string
          meta_title: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          blog_id: string
          content?: string
          created_at?: string
          focus_keyword?: string
          id?: string
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          blog_id?: string
          content?: string
          created_at?: string
          focus_keyword?: string
          id?: string
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      page_monitors: {
        Row: {
          blog_id: string
          content_id: string
          content_type: string
          created_at: string | null
          current_rank: number | null
          id: string
          is_active: boolean | null
          keyword: string
          last_check_at: string | null
          last_serp_data: Json | null
          refresh_interval_days: number | null
        }
        Insert: {
          blog_id: string
          content_id: string
          content_type?: string
          created_at?: string | null
          current_rank?: number | null
          id?: string
          is_active?: boolean | null
          keyword: string
          last_check_at?: string | null
          last_serp_data?: Json | null
          refresh_interval_days?: number | null
        }
        Update: {
          blog_id?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          current_rank?: number | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          last_check_at?: string | null
          last_serp_data?: Json | null
          refresh_interval_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_monitors_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_admin: boolean | null
          is_suspended: boolean | null
          last_active_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          last_active_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_admin?: boolean | null
          is_suspended?: boolean | null
          last_active_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routing_rules: {
        Row: {
          action_type: string
          action_value: string | null
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
        }
        Insert: {
          action_type: string
          action_value?: string | null
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
        }
        Update: {
          action_type?: string
          action_value?: string | null
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          articles_per_month: number
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          tenant_id: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          articles_per_month?: number
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          tenant_id: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          articles_per_month?: number
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          tenant_id?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      super_pages: {
        Row: {
          autor: Json | null
          blog_id: string
          content_markdown: string | null
          created_at: string | null
          cta_primary: Json | null
          cta_secondary: Json | null
          faq: Json | null
          focus_keyword: string | null
          id: string
          imagens: Json | null
          internal_links: Json | null
          key_takeaways: Json | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          quality_issues: string[] | null
          quality_score: number | null
          schema_article: Json | null
          schema_faqpage: Json | null
          serp_data: Json | null
          slug: string
          status: string | null
          title: string
          toc: Json | null
          updated_at: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          autor?: Json | null
          blog_id: string
          content_markdown?: string | null
          created_at?: string | null
          cta_primary?: Json | null
          cta_secondary?: Json | null
          faq?: Json | null
          focus_keyword?: string | null
          id?: string
          imagens?: Json | null
          internal_links?: Json | null
          key_takeaways?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          quality_issues?: string[] | null
          quality_score?: number | null
          schema_article?: Json | null
          schema_faqpage?: Json | null
          serp_data?: Json | null
          slug: string
          status?: string | null
          title: string
          toc?: Json | null
          updated_at?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          autor?: Json | null
          blog_id?: string
          content_markdown?: string | null
          created_at?: string | null
          cta_primary?: Json | null
          cta_secondary?: Json | null
          faq?: Json | null
          focus_keyword?: string | null
          id?: string
          imagens?: Json | null
          internal_links?: Json | null
          key_takeaways?: Json | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          quality_issues?: string[] | null
          quality_score?: number | null
          schema_article?: Json | null
          schema_faqpage?: Json | null
          serp_data?: Json | null
          slug?: string
          status?: string | null
          title?: string
          toc?: Json | null
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "super_pages_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          blog_id: string
          created_at: string
          domain: string
          domain_type: string
          id: string
          status: string
          tenant_id: string
          verified_at: string | null
        }
        Insert: {
          blog_id: string
          created_at?: string
          domain: string
          domain_type?: string
          id?: string
          status?: string
          tenant_id: string
          verified_at?: string | null
        }
        Update: {
          blog_id?: string
          created_at?: string
          domain?: string
          domain_type?: string
          id?: string
          status?: string
          tenant_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          plan: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          plan?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          plan?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_agent_costs_today: {
        Args: never
        Returns: {
          agent_name: string
          avg_duration_ms: number
          calls_count: number
          error_count: number
          total_cost_usd: number
          total_tokens: number
        }[]
      }
      get_client_roi_summary: {
        Args: never
        Returns: {
          ai_cost_usd: number
          articles_count: number
          client_id: string
          client_name: string
          converted_leads: number
          last_active_at: string
          mrr_value: number
          plan: string
          roi_ratio: number
          subcontas_count: number
          total_deal_value: number
          total_leads: number
        }[]
      }
      get_pipeline_cost_breakdown: {
        Args: { run_id: string }
        Returns: {
          agent_name: string
          cost_usd: number
          duration_ms: number
          model_used: string
          status: string
          tokens_used: number
        }[]
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
