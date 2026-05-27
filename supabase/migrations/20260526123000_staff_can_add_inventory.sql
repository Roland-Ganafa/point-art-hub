-- =============================================================================
-- Allow non-admin staff to ADD new inventory items.
--
-- Previously the `stationery` and `gift_store` inventory tables had INSERT
-- restricted to admins only (set in migration 20260320000000). Staff trying
-- to add a new item were rejected by RLS, even though they could record
-- sales against existing items.
--
-- This migration relaxes ONLY the INSERT policy on those two tables.
-- UPDATE and DELETE remain admin-only so staff can stock things in but
-- can't accidentally corrupt or remove existing inventory rows.
-- =============================================================================

-- ---------- stationery ----------
DROP POLICY IF EXISTS "Allow admin insert" ON public.stationery;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery;

CREATE POLICY "Allow authenticated insert"
ON public.stationery
FOR INSERT
TO authenticated
WITH CHECK (true);

-- (UPDATE / DELETE policies on stationery are intentionally left admin-only;
--  see migration 20260320000000_enable_rls_all_tables.sql.)

-- ---------- gift_store ----------
DROP POLICY IF EXISTS "Allow admin insert" ON public.gift_store;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.gift_store;

CREATE POLICY "Allow authenticated insert"
ON public.gift_store
FOR INSERT
TO authenticated
WITH CHECK (true);

-- (UPDATE / DELETE policies on gift_store are intentionally left admin-only.)

DO $$
BEGIN
  RAISE NOTICE 'Non-admin staff can now add new stationery / gift_store inventory items.';
  RAISE NOTICE 'Editing and deleting still require admin role.';
END $$;
