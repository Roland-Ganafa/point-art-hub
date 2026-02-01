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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      art_services: {
        Row: {
          balance: number | null
          created_at: string | null
          date: string
          deposit: number | null
          description: string | null
          done_by: string | null
          expenditure: number
          id: string
          profit: number | null
          quantity: number
          quotation: number | null
          rate: number
          sales: number | null
          service_name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          date?: string
          deposit?: number | null
          description?: string | null
          done_by?: string | null
          expenditure?: number
          id?: string
          profit?: number | null
          quantity?: number
          quotation?: number | null
          rate: number
          sales?: number | null
          service_name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          date?: string
          deposit?: number | null
          description?: string | null
          done_by?: string | null
          expenditure?: number
          id?: string
          profit?: number | null
          quantity?: number
          quotation?: number | null
          rate?: number
          sales?: number | null
          service_name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "art_services_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      embroidery: {
        Row: {
          customer_name: string | null
          date: string
          description: string | null
          id: string
          item_name: string
          phone_number: string | null
          quantity: number
          total_amount: number
          unit_price: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          customer_name?: string | null
          date?: string
          description?: string | null
          id?: string
          item_name: string
          phone_number?: string | null
          quantity: number
          total_amount: number
          unit_price: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          customer_name?: string | null
          date?: string
          description?: string | null
          id?: string
          item_name?: string
          phone_number?: string | null
          quantity?: number
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embroidery_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_daily_sales: {
        Row: {
          id: string
          item: string
          code: string | null
          description: string | null
          quantity: number
          unit: string
          bpx: number
          spx: number
          sold_by: string | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          item: string
          code?: string | null
          description?: string | null
          quantity?: number
          unit?: string
          bpx: number
          spx: number
          sold_by?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          item?: string
          code?: string | null
          description?: string | null
          quantity?: number
          unit?: string
          bpx?: number
          spx?: number
          sold_by?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_daily_sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_store: {
        Row: {
          buying_price: number
          category: string
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          item: string
          profit: number | null
          quantity: number
          selling_price: number
          status: string | null
          updated_by: string | null
        }
        Insert: {
          buying_price: number
          category: string
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          item: string
          profit?: number | null
          quantity: number
          selling_price: number
          status?: string | null
          updated_by?: string | null
        }
        Update: {
          buying_price?: number
          category?: string
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          item?: string
          profit?: number | null
          quantity?: number
          selling_price?: number
          status?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_store_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_store_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          customer_name: string | null
          date: string
          description: string | null
          id: string
          machine_serviceman: string | null
          machine_type: string
          phoneNumber: string | null
          problem_description: string | null
          quantity: number
          rate: number
          total_amount: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          date?: string
          description?: string | null
          id?: string
          machine_serviceman?: string | null
          machine_type: string
          phoneNumber?: string | null
          problem_description?: string | null
          quantity: number
          rate: number
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          date?: string
          description?: string | null
          id?: string
          machine_serviceman?: string | null
          machine_type?: string
          phoneNumber?: string | null
          problem_description?: string | null
          quantity?: number
          rate?: number
          total_amount?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          sales_initials: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          sales_initials?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          sales_initials?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stationery: {
        Row: {
          category: string
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          item: string
          low_stock_threshold: number
          profit_per_unit: number | null
          quantity: number
          rate: number
          selling_price: number | null
          sensitivity: string
          status: string | null
          stock: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          item: string
          low_stock_threshold?: number
          profit_per_unit?: number | null
          quantity: number
          rate: number
          selling_price?: number | null
          sensitivity?: string
          status?: string | null
          stock?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          item?: string
          low_stock_threshold?: number
          profit_per_unit?: number | null
          quantity?: number
          rate?: number
          selling_price?: number | null
          sensitivity?: string
          status?: string | null
          stock?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stationery_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stationery_sales: {
        Row: {
          id: string
          item_id: string
          quantity: number
          selling_price: number
          total_amount: number
          profit: number
          description: string | null
          rate: number | null
          sold_by: string | null
          date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          item_id: string
          quantity: number
          selling_price: number
          total_amount: number
          profit: number
          description?: string | null
          rate?: number | null
          sold_by?: string | null
          date?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          selling_price?: number
          total_amount?: number
          profit?: number
          description?: string | null
          rate?: number | null
          sold_by?: string | null
          date?: string
          created_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          new_email: string
          new_password: string
          new_full_name: string
          new_role: string
          new_sales_initials: string
        }
        Returns: string
      }
      is_admin: {
        Args: Record<string, unknown>
        Returns: boolean
      }
    }
    Enums: {
      frequency_type: "daily" | "weekly" | "monthly"
      gift_category: "cleaning" | "kids_toys" | "birthday" | "custom"
      machine_type: "printer" | "copier" | "scanner" | "binder" | "laminator"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
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
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
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
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
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
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof Database["public"]["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
  ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      frequency_type: ["daily", "weekly", "monthly"],
      gift_category: ["cleaning", "kids_toys", "birthday", "custom"],
      machine_type: ["printer", "copier", "scanner", "binder", "laminator"],
      user_role: ["admin", "user"],
    },
  },
} as const
