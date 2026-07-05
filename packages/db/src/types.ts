/**
 * Hand-written Database types matching packages/db/migrations.
 * Once a Supabase project exists, regenerate with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types.ts
 * and reconcile. Until then this file is the source of truth for TS.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ClientStatus = "lead" | "onboarding" | "active" | "paused" | "archived";
export type ClientPlan = "starter" | "standard" | "pro";
export type ProfileRole = "agency_admin" | "agency_member" | "client_owner" | "client_member";
export type GrantProvider = "domain" | "hosting" | "google_analytics" | "google_business" | "meta" | "other";
export type GrantMethod = "invite" | "delegate" | "transfer";
export type GrantStatus = "requested" | "pending_client" | "granted" | "not_applicable";
export type RequestPriority = "low" | "normal" | "urgent";
export type RequestStatus =
  | "new"
  | "in_review"
  | "in_progress"
  | "awaiting_client"
  | "preview_ready"
  | "done"
  | "declined";
export type AdPlatform = "meta" | "google" | "other";
export type DocumentKind = "contract" | "welcome_pack" | "invoice" | "report" | "other";
export type DocumentStatus = "draft" | "sent" | "viewed" | "accepted";

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: ClientStatus;
          plan: ClientPlan;
          marketing_plan: boolean;
          branding: Json;
          enabled_modules: Json;
          monthly_update_quota: number;
          website_url: string | null;
          domain_registrar: string | null;
          domain_renewal_date: string | null;
          hosting_notes: string | null;
          stripe_customer_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: ClientStatus;
          plan?: ClientPlan;
          marketing_plan?: boolean;
          branding?: Json;
          enabled_modules?: Json;
          monthly_update_quota?: number;
          website_url?: string | null;
          domain_registrar?: string | null;
          domain_renewal_date?: string | null;
          hosting_notes?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: ProfileRole;
          client_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: ProfileRole;
          client_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          client_id: string | null;
          actor_id: string | null;
          verb: string;
          subject_type: string | null;
          subject_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          actor_id?: string | null;
          verb: string;
          subject_type?: string | null;
          subject_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
        Relationships: [];
      };
      scheduled_emails: {
        Row: {
          id: string;
          client_id: string | null;
          template: string;
          payload: Json;
          send_at: string;
          sent_at: string | null;
          resend_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          template: string;
          payload?: Json;
          send_at: string;
          sent_at?: string | null;
          resend_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scheduled_emails"]["Insert"]>;
        Relationships: [];
      };
      email_log: {
        Row: {
          id: string;
          client_id: string | null;
          template: string;
          to_email: string;
          resend_id: string | null;
          status: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          template: string;
          to_email: string;
          resend_id?: string | null;
          status?: string;
          sent_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_log"]["Insert"]>;
        Relationships: [];
      };
      onboarding_responses: {
        Row: {
          id: string;
          client_id: string;
          data: Json;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          data?: Json;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["onboarding_responses"]["Insert"]>;
        Relationships: [];
      };
      access_grants: {
        Row: {
          id: string;
          client_id: string;
          provider: GrantProvider;
          account_identifier: string | null;
          method: GrantMethod;
          status: GrantStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          provider: GrantProvider;
          account_identifier?: string | null;
          method?: GrantMethod;
          status?: GrantStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_grants"]["Insert"]>;
        Relationships: [];
      };
      update_requests: {
        Row: {
          id: string;
          client_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          page_url: string | null;
          priority: RequestPriority;
          status: RequestStatus;
          preview_url: string | null;
          assigned_to: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          page_url?: string | null;
          priority?: RequestPriority;
          status?: RequestStatus;
          preview_url?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["update_requests"]["Insert"]>;
        Relationships: [];
      };
      request_comments: {
        Row: {
          id: string;
          request_id: string;
          author_id: string | null;
          body: string;
          attachment_paths: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          author_id?: string | null;
          body: string;
          attachment_paths?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["request_comments"]["Insert"]>;
        Relationships: [];
      };
      internal_notes: {
        Row: {
          id: string;
          client_id: string;
          request_id: string | null;
          author_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          request_id?: string | null;
          author_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["internal_notes"]["Insert"]>;
        Relationships: [];
      };
      request_ratings: {
        Row: {
          id: string;
          request_id: string;
          client_id: string;
          score: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          client_id: string;
          score: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["request_ratings"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          client_id: string;
          sender_id: string | null;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          sender_id?: string | null;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          client_id: string;
          stripe_invoice_id: string;
          amount_pennies: number;
          status: string;
          hosted_invoice_url: string | null;
          pdf_url: string | null;
          issued_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          stripe_invoice_id: string;
          amount_pennies: number;
          status: string;
          hosted_invoice_url?: string | null;
          pdf_url?: string | null;
          issued_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      ad_spend: {
        Row: {
          id: string;
          client_id: string;
          month: string;
          platform: AdPlatform;
          spend_pennies: number;
          clicks: number;
          impressions: number;
          leads: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          month: string;
          platform: AdPlatform;
          spend_pennies?: number;
          clicks?: number;
          impressions?: number;
          leads?: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ad_spend"]["Insert"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          kind: DocumentKind;
          title: string;
          storage_path: string;
          status: DocumentStatus;
          accepted_at: string | null;
          accepted_by: string | null;
          accepted_name_typed: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          kind?: DocumentKind;
          title: string;
          storage_path: string;
          status?: DocumentStatus;
          accepted_at?: string | null;
          accepted_by?: string | null;
          accepted_name_typed?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      uptime_checks: {
        Row: {
          id: string;
          client_id: string;
          checked_at: string;
          ok: boolean;
          status_code: number | null;
          response_ms: number | null;
          error: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          checked_at?: string;
          ok: boolean;
          status_code?: number | null;
          response_ms?: number | null;
          error?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["uptime_checks"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_agency: { Args: Record<string, never>; Returns: boolean };
      current_client_id: { Args: Record<string, never>; Returns: string | null };
    };
    Enums: {
      client_status: ClientStatus;
      client_plan: ClientPlan;
      profile_role: ProfileRole;
      grant_provider: GrantProvider;
      grant_method: GrantMethod;
      grant_status: GrantStatus;
      request_priority: RequestPriority;
      request_status: RequestStatus;
      ad_platform: AdPlatform;
      document_kind: DocumentKind;
      document_status: DocumentStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

// Convenience row aliases
export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type UpdateRequestRow = Database["public"]["Tables"]["update_requests"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type AdSpendRow = Database["public"]["Tables"]["ad_spend"]["Row"];
export type AccessGrantRow = Database["public"]["Tables"]["access_grants"]["Row"];
export type UptimeCheckRow = Database["public"]["Tables"]["uptime_checks"]["Row"];
