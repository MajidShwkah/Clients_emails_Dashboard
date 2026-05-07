export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          id: number;
          created_at: string;
          name: string;
          business_action_email: string | null;
          zoho: Json | null;
          customer_counting_spreadsheet_id: string | null;
          ticket_system: string | null;
          subscription_expiration: string | null;
          comments: string | null;
          is_locked: boolean;
          is_archived: boolean;
          webhook: Json | null;
          workflow_settings: Json | null;
          is_client: boolean | null;
          updated_at: string | null;
          config_status: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          name: string;
          business_action_email?: string | null;
          zoho?: Json | null;
          customer_counting_spreadsheet_id?: string | null;
          ticket_system?: string | null;
          subscription_expiration?: string | null;
          comments?: string | null;
          is_locked?: boolean;
          is_archived?: boolean;
          webhook?: Json | null;
          workflow_settings?: Json | null;
          is_client?: boolean | null;
          updated_at?: string | null;
          config_status?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          name?: string;
          business_action_email?: string | null;
          zoho?: Json | null;
          customer_counting_spreadsheet_id?: string | null;
          ticket_system?: string | null;
          subscription_expiration?: string | null;
          comments?: string | null;
          is_locked?: boolean;
          is_archived?: boolean;
          webhook?: Json | null;
          workflow_settings?: Json | null;
          is_client?: boolean | null;
          updated_at?: string | null;
          config_status?: string | null;
        };
      };
      branches: {
        Row: {
          id: number;
          created_at: string;
          brand: number;
          name: string | null;
          location: string | null;
          is_active: boolean;
          reference: string | null;
          group: number | null;
          is_development: boolean;
          is_customer_success_priority: boolean;
          serial_number: number | null;
          host_name: string | null;
          is_installed: boolean | null;
          service_status: string | null;
          is_locked: boolean;
          last_pkg_update_date: string | null;
          last_commit_id: string | null;
          current_pull_branch_name: string | null;
          is_archived: boolean;
          rustdesk_id: string | null;
          updated_at: string | null;
          next_pkg_update_date: string | null;
          config_status: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          brand: number;
          name?: string | null;
          location?: string | null;
          is_active?: boolean;
          reference?: string | null;
          group?: number | null;
          is_development?: boolean;
          is_customer_success_priority?: boolean;
          serial_number?: number | null;
          host_name?: string | null;
          is_installed?: boolean | null;
          service_status?: string | null;
          is_locked?: boolean;
          last_pkg_update_date?: string | null;
          last_commit_id?: string | null;
          current_pull_branch_name?: string | null;
          is_archived?: boolean;
          rustdesk_id?: string | null;
          updated_at?: string | null;
          next_pkg_update_date?: string | null;
          config_status?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          brand?: number;
          name?: string | null;
          location?: string | null;
          is_active?: boolean;
          reference?: string | null;
          group?: number | null;
          is_development?: boolean;
          is_customer_success_priority?: boolean;
          serial_number?: number | null;
          host_name?: string | null;
          is_installed?: boolean | null;
          service_status?: string | null;
          is_locked?: boolean;
          last_pkg_update_date?: string | null;
          last_commit_id?: string | null;
          current_pull_branch_name?: string | null;
          is_archived?: boolean;
          rustdesk_id?: string | null;
          updated_at?: string | null;
          next_pkg_update_date?: string | null;
          config_status?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
  sync: {
    Tables: {
      email_recipients: {
        Row: {
          id: string;
          brand_id: number;
          branch_id: number | null;
          email: string;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          brand_id: number;
          branch_id?: number | null;
          email: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: number;
          branch_id?: number | null;
          email?: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      global_recipients: {
        Row: {
          id: string;
          email: string;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      email_sends: {
        Row: {
          id: string;
          rid: string;
          violation_id: string | null;
          brand_id: number | null;
          branch_id: number | null;
          recipient_email: string;
          recipient_source: string;
          recipient_id: string | null;
          subject: string | null;
          sg_message_id: string | null;
          status: string;
          failure_reason: string | null;
          sent_at: string;
          processed_at: string | null;
          delivered_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          bounced_at: string | null;
          last_event_at: string | null;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
      };
      email_events: {
        Row: {
          id: number;
          send_id: string | null;
          sg_message_id: string | null;
          recipient_email: string;
          event_type: string;
          event_at: string;
          rid: string | null;
          brand_id: number | null;
          branch_id: number | null;
          violation_id: string | null;
          reason: string | null;
          user_agent: string | null;
          raw: Json;
          received_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
      };
      email_audit_log: {
        Row: {
          id: number;
          table_name: string;
          record_id: string;
          action: string;
          old_values: Json | null;
          new_values: Json | null;
          changed_by: string | null;
          changed_at: string;
        };
        Insert: Record<string, never>;
        Update: Record<string, never>;
      };
    };
    Views: {
      v_expected_recipients: {
        Row: {
          brand_id: number | null;
          branch_id: number | null;
          email: string | null;
          source: string | null;
          recipient_id: string | null;
        };
      };
      v_missing_deliveries: {
        Row: {
          brand_id: number | null;
          branch_id: number | null;
          email: string | null;
          source: string | null;
          send_day: string | null;
          total_attempts: number | null;
          delivered: number | null;
          failed: number | null;
          pending: number | null;
          last_attempt: string | null;
          last_delivered: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
