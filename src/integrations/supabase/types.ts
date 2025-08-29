export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      art_services: {
        Row: {
          balance: number | null
          created_at: string | null
          date: string
          deposit: number
          description: string | null
          done_by: string | null
          expenditure: number
          id: string
          profit: number | null
          quantity: number
          quotation: number
          rate: number
          sales: number | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          date?: string
          deposit?: number
          description?: string | null
          done_by?: string | null
          expenditure?: number
          id?: string
          profit?: number | null
          quantity?: number
          quotation?: number
          rate: number
          sales?: number | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          date?: string
          deposit?: number
          description?: string | null
          done_by?: string | null
          expenditure?: number
          id?: string
          profit?: number | null
          quantity?: number
          quotation?: number
          rate?: number
          sales?: number | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "art_services_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      embroidery: {
        Row: {
          balance: number | null
          created_at: string | null
          date: string
          deposit: number
          done_by: string | null
          expenditure: number
          id: string
          job_description: string
          profit: number | null
          quantity: number
          quotation: number
          rate: number | null
          sales: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          date?: string
          deposit?: number
          done_by?: string | null
          expenditure?: number
          id?: string
          job_description: string
          profit?: number | null
          quantity?: number
          quotation: number
          rate?: number | null
          sales?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          date?: string
          deposit?: number
          done_by?: string | null
          expenditure?: number
          id?: string
          job_description?: string
          profit?: number | null
          quantity?: number
          quotation?: number
          rate?: number | null
          sales?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embroidery_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_daily_sales: {
        Row: {
          bpx: number
          code: string | null
          created_at: string | null
          date: string
          id: string
          item: string
          quantity: number
          spx: number
          unit: string
          updated_at: string | null
        }
        Insert: {
          bpx: number
          code?: string | null
          created_at?: string | null
          date?: string
          id?: string
          item: string
          quantity?: number
          spx: number
          unit?: string
          updated_at?: string | null
        }
        Update: {
          bpx?: number
          code?: string | null
          created_at?: string | null
          date?: string
          id?: string
          item?: string
          quantity?: number
          spx?: number
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gift_store: {
        Row: {
          category: Database["public"]["Enums"]["gift_category"]
          created_at: string | null
          custom_category: string | null
          date: string
          id: string
          item: string
          low_stock_threshold: number
          profit_per_unit: number | null
          quantity: number
          rate: number
          sales: number | null
          selling_price: number | null
          sold_by: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["gift_category"]
          created_at?: string | null
          custom_category?: string | null
          date?: string
          id?: string
          item: string
          low_stock_threshold?: number
          profit_per_unit?: number | null
          quantity?: number
          rate: number
          sales?: number | null
          selling_price?: number | null
          sold_by?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["gift_category"]
          created_at?: string | null
          custom_category?: string | null
          date?: string
          id?: string
          item?: string
          low_stock_threshold?: number
          profit_per_unit?: number | null
          quantity?: number
          rate?: number
          sales?: number | null
          selling_price?: number | null
          sold_by?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_store_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          date: string
          done_by: string | null
          expenditure: number
          id: string
          machine_name: Database["public"]["Enums"]["machine_type"]
          quantity: number
          rate: number
          sales: number | null
          service_description: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          done_by?: string | null
          expenditure?: number
          id?: string
          machine_name: Database["public"]["Enums"]["machine_type"]
          quantity?: number
          rate: number
          sales?: number | null
          service_description: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          done_by?: string | null
          expenditure?: number
          id?: string
          machine_name?: Database["public"]["Enums"]["machine_type"]
          quantity?: number
          rate?: number
          sales?: number | null
          service_description?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          sales_initials: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          sales_initials?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          sales_initials?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stationery: {
        Row: {
          category: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          item: string
          low_stock_threshold: number
          profit_per_unit: number | null
          quantity: number
          rate: number
          sales: number | null
          selling_price: number
          sold_by: string | null
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          item: string
          low_stock_threshold?: number
          profit_per_unit?: number | null
          quantity?: number
          rate: number
          sales?: number | null
          selling_price: number
          sold_by?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          item?: string
          low_stock_threshold?: number
          profit_per_unit?: number | null
          quantity?: number
          rate?: number
          sales?: number | null
          selling_price?: number
          sold_by?: string | null
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stationery_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stationery_sales: {
        Row: {
          created_at: string | null
          date: string
          id: string
          item_id: string
          profit: number
          quantity: number
          selling_price: number
          sold_by: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          item_id: string
          profit: number
          quantity: number
          selling_price: number
          sold_by?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          item_id?: string
          profit?: number
          quantity?: number
          selling_price?: number
          sold_by?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stationery_sales_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stationery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stationery_sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          user_name: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_values: Record<string, unknown> | null
          new_values: Record<string, unknown> | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          action: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Record<string, unknown> | null
          new_values?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          user_name?: string | null
          action?: string
          table_name?: string | null
          record_id?: string | null
          old_values?: Record<string, unknown> | null
          new_values?: Record<string, unknown> | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_audit_log_table_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reset_audit_log_schema_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      gift_category: "cleaning" | "kids_toys" | "birthday" | "custom"
      machine_type: "printer" | "copier" | "scanner" | "binder" | "laminator"
      user_role: "admin" | "user"
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
      gift_category: ["cleaning", "kids_toys", "birthday", "custom"],
      machine_type: ["printer", "copier", "scanner", "binder", "laminator"],
    },
  },
} as const
