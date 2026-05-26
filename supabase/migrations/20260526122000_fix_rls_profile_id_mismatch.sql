-- =============================================================================
-- FIX: is_admin() and RLS insert policies were comparing profiles.id to
-- auth.uid(), but:
--   * auth.uid()  = the Supabase auth user id (lives in auth.users)
--   * profiles.id = a separately-generated PK with a DB default
--   * profiles.user_id = the FK to auth.users (this is what auth.uid() matches)
--
-- The comparison only happened to work for legacy profile rows created by the
-- old client code that forced `id = user.id`. For any properly-created
-- profile (random id), is_admin() returns false and the
-- `sold_by/done_by = auth.uid()` checks reject every insert that attributes
-- ownership to the user — which is the visible "sales aren't entering"
-- symptom.
--
-- This migration:
--   1. Rewrites is_admin() to join via user_id
--   2. Adds current_profile_id() helper that returns profiles.id for the
--      calling auth user
--   3. Rewrites every sales-table insert policy to compare against
--      current_profile_id() instead of auth.uid()
--   4. Same for invoices.created_by
-- =============================================================================

-- 1. Correct is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
     WHERE user_id = auth.uid()
       AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Helper: profile PK for the calling user (NULL if no profile yet)
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;

-- 3. Rewrite sales-table insert policies. sold_by / done_by reference
--    profiles.id, so they must be compared against current_profile_id(),
--    not auth.uid().

-- art_services (done_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.art_services;
CREATE POLICY "Allow authenticated insert"
ON public.art_services
FOR INSERT TO authenticated
WITH CHECK (done_by IS NULL OR done_by = public.current_profile_id() OR public.is_admin());

-- embroidery (done_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.embroidery;
CREATE POLICY "Allow authenticated insert"
ON public.embroidery
FOR INSERT TO authenticated
WITH CHECK (done_by IS NULL OR done_by = public.current_profile_id() OR public.is_admin());

-- machines (done_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.machines;
CREATE POLICY "Allow authenticated insert"
ON public.machines
FOR INSERT TO authenticated
WITH CHECK (done_by IS NULL OR done_by = public.current_profile_id() OR public.is_admin());

-- gift_daily_sales (sold_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.gift_daily_sales;
CREATE POLICY "Allow authenticated insert"
ON public.gift_daily_sales
FOR INSERT TO authenticated
WITH CHECK (sold_by IS NULL OR sold_by = public.current_profile_id() OR public.is_admin());

-- stationery_daily_sales (sold_by)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'stationery_daily_sales') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery_daily_sales';
    EXECUTE 'CREATE POLICY "Allow authenticated insert"
             ON public.stationery_daily_sales
             FOR INSERT TO authenticated
             WITH CHECK (sold_by IS NULL OR sold_by = public.current_profile_id() OR public.is_admin())';
  END IF;
END $$;

-- stationery_sales (sold_by) — this is the table the client reports against
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery_sales;
CREATE POLICY "Allow authenticated insert"
ON public.stationery_sales
FOR INSERT TO authenticated
WITH CHECK (sold_by IS NULL OR sold_by = public.current_profile_id() OR public.is_admin());

-- 4. invoices.created_by — same pattern (FK to profiles.id, not auth.uid())
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
CREATE POLICY "Users can create invoices"
ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (created_by = public.current_profile_id() OR public.is_admin());

-- Update the auto-set trigger to use the profile id (not auth.uid())
CREATE OR REPLACE FUNCTION public.set_invoice_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_profile_id();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE 'RLS / is_admin() now correctly join through profiles.user_id.';
  RAISE NOTICE 'Sales inserts attributing sold_by to the calling user will now pass for all properly-created profiles.';
END $$;
