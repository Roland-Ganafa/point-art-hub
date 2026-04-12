-- =============================================================================
-- Security Fixes Migration
-- Addresses:
--   1. Sales tables: prevent sold_by/done_by spoofing on INSERT
--   2. customers: restrict to authenticated SELECT; admin-only UPDATE/DELETE
--   3. invoices: auto-set created_by via trigger; enforce on INSERT
--   4. profiles: add admin UPDATE policy so AdminProfile role changes work
-- =============================================================================

-- Ensure is_admin() exists (safe re-creation)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================================
-- 1. SALES TABLES — restrict INSERT so sold_by/done_by cannot be spoofed
--    Staff can only record a sale attributed to themselves or leave it NULL.
--    Admins can insert with any attribution.
-- =============================================================================

-- art_services (done_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.art_services;
CREATE POLICY "Allow authenticated insert"
ON public.art_services
FOR INSERT TO authenticated
WITH CHECK (done_by IS NULL OR done_by = auth.uid() OR is_admin());

-- embroidery (done_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.embroidery;
CREATE POLICY "Allow authenticated insert"
ON public.embroidery
FOR INSERT TO authenticated
WITH CHECK (done_by IS NULL OR done_by = auth.uid() OR is_admin());

-- machines (done_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.machines;
CREATE POLICY "Allow authenticated insert"
ON public.machines
FOR INSERT TO authenticated
WITH CHECK (done_by IS NULL OR done_by = auth.uid() OR is_admin());

-- gift_daily_sales (sold_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.gift_daily_sales;
CREATE POLICY "Allow authenticated insert"
ON public.gift_daily_sales
FOR INSERT TO authenticated
WITH CHECK (sold_by IS NULL OR sold_by = auth.uid() OR is_admin());

-- stationery_daily_sales (sold_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery_daily_sales;
CREATE POLICY "Allow authenticated insert"
ON public.stationery_daily_sales
FOR INSERT TO authenticated
WITH CHECK (sold_by IS NULL OR sold_by = auth.uid() OR is_admin());

-- stationery_sales (sold_by)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.stationery_sales;
CREATE POLICY "Allow authenticated insert"
ON public.stationery_sales
FOR INSERT TO authenticated
WITH CHECK (sold_by IS NULL OR sold_by = auth.uid() OR is_admin());

-- =============================================================================
-- 2. CUSTOMERS TABLE — require authentication to SELECT; admin-only for
--    UPDATE and DELETE; any staff can INSERT
--    Wrapped in DO block so it skips safely if the table doesn't exist yet.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN

    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
    DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
    DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
    DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

    EXECUTE $p$ CREATE POLICY "Authenticated users can view customers"
      ON public.customers FOR SELECT TO authenticated USING (true); $p$;

    EXECUTE $p$ CREATE POLICY "Authenticated users can insert customers"
      ON public.customers FOR INSERT TO authenticated WITH CHECK (true); $p$;

    EXECUTE $p$ CREATE POLICY "Admins can update customers"
      ON public.customers FOR UPDATE TO authenticated
      USING (is_admin()) WITH CHECK (is_admin()); $p$;

    EXECUTE $p$ CREATE POLICY "Admins can delete customers"
      ON public.customers FOR DELETE TO authenticated USING (is_admin()); $p$;

  ELSE
    RAISE NOTICE 'Table public.customers does not exist — skipping customers policies.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_transactions') THEN

    ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view customer_transactions" ON public.customer_transactions;
    DROP POLICY IF EXISTS "Authenticated users can insert customer_transactions" ON public.customer_transactions;
    DROP POLICY IF EXISTS "Authenticated users can update customer_transactions" ON public.customer_transactions;
    DROP POLICY IF EXISTS "Authenticated users can delete customer_transactions" ON public.customer_transactions;

    EXECUTE $p$ CREATE POLICY "Authenticated users can view customer_transactions"
      ON public.customer_transactions FOR SELECT TO authenticated USING (true); $p$;

    EXECUTE $p$ CREATE POLICY "Authenticated users can insert customer_transactions"
      ON public.customer_transactions FOR INSERT TO authenticated WITH CHECK (true); $p$;

    EXECUTE $p$ CREATE POLICY "Admins can update customer_transactions"
      ON public.customer_transactions FOR UPDATE TO authenticated
      USING (is_admin()) WITH CHECK (is_admin()); $p$;

    EXECUTE $p$ CREATE POLICY "Admins can delete customer_transactions"
      ON public.customer_transactions FOR DELETE TO authenticated USING (is_admin()); $p$;

  ELSE
    RAISE NOTICE 'Table public.customer_transactions does not exist — skipping customer_transactions policies.';
  END IF;
END $$;

-- =============================================================================
-- 3. INVOICES — auto-set created_by on INSERT via trigger so the ownership
--    check always has a value; enforce created_by = auth.uid() on INSERT
-- =============================================================================

-- Trigger function: set created_by to the calling user if not provided
CREATE OR REPLACE FUNCTION public.set_invoice_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_invoice_created_by ON public.invoices;
CREATE TRIGGER trg_set_invoice_created_by
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_created_by();

-- Tighten INSERT: created_by must be the calling user (trigger sets it if null)
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
CREATE POLICY "Users can create invoices"
ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

-- =============================================================================
-- 4. PROFILES — add admin UPDATE/DELETE policies so AdminProfile role
--    management works server-side (currently missing, causing silent failures)
-- =============================================================================

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Prevent non-admins from escalating their own role
-- Re-create own-profile update policy to block role field changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Non-admins cannot change their own role
    role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    OR is_admin()
  )
);
