-- =============================================================================
-- Enable Row Level Security on all unrestricted tables
-- Point Art Hub - Business Management App
-- =============================================================================

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================================
-- art_services
-- Sales/operational table: authenticated SELECT + INSERT; admin UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.art_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.art_services;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.art_services;
DROP POLICY IF EXISTS "Allow admin update" ON public.art_services;
DROP POLICY IF EXISTS "Allow admin delete" ON public.art_services;

CREATE POLICY "Allow authenticated read"
ON public.art_services
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.art_services
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update"
ON public.art_services
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.art_services
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- audit_log
-- Append-only: authenticated SELECT + INSERT; no UPDATE or DELETE for anyone
-- =============================================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.audit_log;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.audit_log;

CREATE POLICY "Allow authenticated read"
ON public.audit_log
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =============================================================================
-- embroidery
-- Sales/operational table: authenticated SELECT + INSERT; admin UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.embroidery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.embroidery;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.embroidery;
DROP POLICY IF EXISTS "Allow admin update" ON public.embroidery;
DROP POLICY IF EXISTS "Allow admin delete" ON public.embroidery;

CREATE POLICY "Allow authenticated read"
ON public.embroidery
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.embroidery
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update"
ON public.embroidery
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.embroidery
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- gift_daily_sales
-- Sales/operational table: authenticated SELECT + INSERT; admin UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.gift_daily_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Allow admin update" ON public.gift_daily_sales;
DROP POLICY IF EXISTS "Allow admin delete" ON public.gift_daily_sales;

CREATE POLICY "Allow authenticated read"
ON public.gift_daily_sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.gift_daily_sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update"
ON public.gift_daily_sales
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.gift_daily_sales
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- gift_store
-- Inventory table: authenticated SELECT; admin INSERT + UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.gift_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.gift_store;
DROP POLICY IF EXISTS "Allow admin insert" ON public.gift_store;
DROP POLICY IF EXISTS "Allow admin update" ON public.gift_store;
DROP POLICY IF EXISTS "Allow admin delete" ON public.gift_store;

CREATE POLICY "Allow authenticated read"
ON public.gift_store
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin insert"
ON public.gift_store
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Allow admin update"
ON public.gift_store
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.gift_store
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- machines
-- Sales/operational table: authenticated SELECT + INSERT; admin UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.machines;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.machines;
DROP POLICY IF EXISTS "Allow admin update" ON public.machines;
DROP POLICY IF EXISTS "Allow admin delete" ON public.machines;

CREATE POLICY "Allow authenticated read"
ON public.machines
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.machines
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update"
ON public.machines
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.machines
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- stationery
-- Inventory table: authenticated SELECT; admin INSERT + UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.stationery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.stationery;
DROP POLICY IF EXISTS "Allow admin insert" ON public.stationery;
DROP POLICY IF EXISTS "Allow admin update" ON public.stationery;
DROP POLICY IF EXISTS "Allow admin delete" ON public.stationery;

CREATE POLICY "Allow authenticated read"
ON public.stationery
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin insert"
ON public.stationery
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Allow admin update"
ON public.stationery
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.stationery
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- stationery_daily_sales
-- Sales/operational table: authenticated SELECT + INSERT; admin UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.stationery_daily_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.stationery_daily_sales;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery_daily_sales;
DROP POLICY IF EXISTS "Allow admin update" ON public.stationery_daily_sales;
DROP POLICY IF EXISTS "Allow admin delete" ON public.stationery_daily_sales;

CREATE POLICY "Allow authenticated read"
ON public.stationery_daily_sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.stationery_daily_sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update"
ON public.stationery_daily_sales
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.stationery_daily_sales
FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================================================
-- stationery_sales
-- Sales/operational table: authenticated SELECT + INSERT; admin UPDATE + DELETE
-- =============================================================================

ALTER TABLE public.stationery_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.stationery_sales;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery_sales;
DROP POLICY IF EXISTS "Allow admin update" ON public.stationery_sales;
DROP POLICY IF EXISTS "Allow admin delete" ON public.stationery_sales;

CREATE POLICY "Allow authenticated read"
ON public.stationery_sales
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.stationery_sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update"
ON public.stationery_sales
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Allow admin delete"
ON public.stationery_sales
FOR DELETE
TO authenticated
USING (is_admin());
