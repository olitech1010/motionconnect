export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string
          name: string
          slug: string
          data_limit: string
          data_limit_bytes: number
          duration_label: string
          duration_seconds: number
          amount: number
          mikrotik_profile: string
          signal_bars: number
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          data_limit: string
          data_limit_bytes: number
          duration_label: string
          duration_seconds: number
          amount: number
          mikrotik_profile: string
          signal_bars?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          data_limit?: string
          data_limit_bytes?: number
          duration_label?: string
          duration_seconds?: number
          amount?: number
          mikrotik_profile?: string
          signal_bars?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          reference: string
          hubtel_reference: string | null
          package_id: string | null
          package_name: string
          amount: number
          phone: string
          mac_address: string
          ip_address: string | null
          status: 'pending' | 'success' | 'failed' | 'expired'
          payment_method: string
          voucher_code: string | null
          mikrotik_username: string | null
          mikrotik_synced: boolean
          error_message: string | null
          sms_status: 'sent' | 'failed' | null
          device_info: string | null
          data_used_bytes: number
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reference: string
          hubtel_reference?: string | null
          package_id?: string | null
          package_name: string
          amount: number
          phone: string
          mac_address: string
          ip_address?: string | null
          status?: 'pending' | 'success' | 'failed' | 'expired'
          payment_method?: string
          voucher_code?: string | null
          mikrotik_username?: string | null
          mikrotik_synced?: boolean
          error_message?: string | null
          sms_status?: 'sent' | 'failed' | null
          device_info?: string | null
          data_used_bytes?: number
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reference?: string
          hubtel_reference?: string | null
          package_id?: string | null
          package_name?: string
          amount?: number
          phone?: string
          mac_address?: string
          ip_address?: string | null
          status?: 'pending' | 'success' | 'failed' | 'expired'
          payment_method?: string
          voucher_code?: string | null
          mikrotik_username?: string | null
          mikrotik_synced?: boolean
          error_message?: string | null
          sms_status?: 'sent' | 'failed' | null
          device_info?: string | null
          data_used_bytes?: number
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      routers: {
        Row: {
          id: string
          name: string
          campus: string
          ip_address: string
          api_port: number
          api_username: string
          api_status: 'online' | 'offline' | 'unknown'
          router_model: string
          router_os_version: string
          last_checked: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          campus: string
          ip_address: string
          api_port?: number
          api_username: string
          api_status?: 'online' | 'offline' | 'unknown'
          router_model?: string
          router_os_version?: string
          last_checked?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          campus?: string
          ip_address?: string
          api_port?: number
          api_username?: string
          api_status?: 'online' | 'offline' | 'unknown'
          router_model?: string
          router_os_version?: string
          last_checked?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          action: string
          actor: string
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          actor?: string
          details?: Json
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          actor?: string
          details?: Json
          created_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

