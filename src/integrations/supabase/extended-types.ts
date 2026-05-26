// Extended Supabase types for tables not yet present in the auto-generated `types.ts`.
// Wraps the existing typed `supabase` client and re-exports it as `supabaseTyped`.
//
// Tables added here: invoices, invoice_items, customers, audit_log, app_settings,
// stationery_daily_sales.
//
// Shapes are derived from the SQL migrations under `supabase/migrations/`.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./types";
import { supabase } from "./client";

type InvoicesRow = {
  id: string;
  invoice_number: string;
  reference_number: string;
  customer_name: string;
  invoice_date: string;
  total_amount: number;
  amount_in_words: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

type InvoicesInsert = {
  id?: string;
  invoice_number: string;
  reference_number: string;
  customer_name: string;
  invoice_date?: string;
  total_amount?: number;
  amount_in_words?: string | null;
  status?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
};

type InvoicesUpdate = Partial<InvoicesInsert>;

type InvoiceItemsRow = {
  id: string;
  invoice_id: string;
  serial_number: number;
  particulars: string;
  description: string | null;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
};

type InvoiceItemsInsert = {
  id?: string;
  invoice_id: string;
  serial_number: number;
  particulars: string;
  description?: string | null;
  quantity?: number;
  rate?: number;
  amount?: number;
  created_at?: string;
};

type InvoiceItemsUpdate = Partial<InvoiceItemsInsert>;

type CustomersRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  customer_type: string | null;
  total_purchases: number | null;
  outstanding_balance: number | null;
  credit_limit: number | null;
  preferred_contact: string | null;
  marketing_consent: boolean | null;
  notes: string | null;
  tags: string[] | null;
  last_purchase_date: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CustomersInsert = {
  id?: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  customer_type?: string | null;
  total_purchases?: number | null;
  outstanding_balance?: number | null;
  credit_limit?: number | null;
  preferred_contact?: string | null;
  marketing_consent?: boolean | null;
  notes?: string | null;
  tags?: string[] | null;
  last_purchase_date?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CustomersUpdate = Partial<CustomersInsert>;

type AuditLogRow = {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
};

type AuditLogInsert = {
  id?: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  table_name?: string | null;
  record_id?: string | null;
  old_values?: Json | null;
  new_values?: Json | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
};

type AuditLogUpdate = Partial<AuditLogInsert>;

type AppSettingsRow = {
  id: string;
  key: string;
  value: Json | null;
  created_at: string | null;
  updated_at: string | null;
};

type AppSettingsInsert = {
  id?: string;
  key: string;
  value?: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AppSettingsUpdate = Partial<AppSettingsInsert>;

type StationeryDailySalesRow = {
  id: string;
  category: string;
  item: string;
  description: string | null;
  quantity: number;
  rate: number;
  selling_price: number;
  profit_per_unit: number;
  total_value: number;
  sold_by: string | null;
  date: string;
  created_at: string | null;
  updated_at: string | null;
};

type StationeryDailySalesInsert = {
  id?: string;
  category: string;
  item: string;
  description?: string | null;
  quantity: number;
  rate: number;
  selling_price: number;
  profit_per_unit: number;
  total_value: number;
  sold_by?: string | null;
  date?: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type StationeryDailySalesUpdate = Partial<StationeryDailySalesInsert>;

export type DatabaseExtended = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      invoices: {
        Row: InvoicesRow;
        Insert: InvoicesInsert;
        Update: InvoicesUpdate;
        Relationships: [];
      };
      invoice_items: {
        Row: InvoiceItemsRow;
        Insert: InvoiceItemsInsert;
        Update: InvoiceItemsUpdate;
        Relationships: [];
      };
      customers: {
        Row: CustomersRow;
        Insert: CustomersInsert;
        Update: CustomersUpdate;
        Relationships: [];
      };
      audit_log: {
        Row: AuditLogRow;
        Insert: AuditLogInsert;
        Update: AuditLogUpdate;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettingsRow;
        Insert: AppSettingsInsert;
        Update: AppSettingsUpdate;
        Relationships: [];
      };
      stationery_daily_sales: {
        Row: StationeryDailySalesRow;
        Insert: StationeryDailySalesInsert;
        Update: StationeryDailySalesUpdate;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      get_next_invoice_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_next_reference_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
};

export const supabaseTyped = supabase as unknown as SupabaseClient<DatabaseExtended>;
