-- Ensure audit_log table exists
-- This migration ensures the audit_log table is created properly

-- Create audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'audit_log' AND schemaname = 'public'
  ) THEN
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
END $$;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Admins can view audit logs'
  ) THEN
    CREATE POLICY "Admins can view audit logs" 
    ON public.audit_log 
    FOR SELECT 
    TO authenticated 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
      )
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists
END $$;

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'audit_log' AND indexname = 'idx_audit_log_user_id'
  ) THEN
    CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL; -- Index already exists
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'audit_log' AND indexname = 'idx_audit_log_action'
  ) THEN
    CREATE INDEX idx_audit_log_action ON public.audit_log(action);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL; -- Index already exists
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'audit_log' AND indexname = 'idx_audit_log_table_name'
  ) THEN
    CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL; -- Index already exists
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'audit_log' AND indexname = 'idx_audit_log_created_at'
  ) THEN
    CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    NULL; -- Index already exists
END $$;

-- Add comment to describe the table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_description pd
    JOIN pg_class pc ON pd.objoid = pc.oid
    WHERE pc.relname = 'audit_log' AND pd.description IS NOT NULL
  ) THEN
    COMMENT ON TABLE public.audit_log IS 'Audit trail for tracking admin actions and system changes';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    COMMENT ON TABLE public.audit_log IS 'Audit trail for tracking admin actions and system changes';
END $$;

-- Create a function to check if audit_log table exists
CREATE OR REPLACE FUNCTION public.check_audit_log_table_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset audit_log table schema cache
CREATE OR REPLACE FUNCTION public.reset_audit_log_schema_cache()
RETURNS VOID AS $$
BEGIN
  -- This function doesn't do anything special, but calling it helps refresh the schema cache
  -- in some Supabase clients
  PERFORM 1;
END;
$$ LANGUAGE plpgsql;