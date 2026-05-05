-- =============================================================================
-- Fix: Remove duplicate stationery_sales records caused by the date-filter bug
-- =============================================================================
-- Root cause: handleSubmit stored `date` as a full ISO timestamp
-- (e.g. "2026-05-05T14:30:45Z") but fetchData queried with
-- .eq("date", "2026-05-05"). PostgREST's eq() performs exact equality on a
-- TIMESTAMPTZ column, so the inserted row was never returned, causing cashiers
-- to re-submit and create duplicate records.
--
-- The frontend fix (gte/lt date-range query in fetchData) prevents this from
-- happening again. This migration cleans up existing duplicates.
-- =============================================================================

-- Step 1: Show a preview of duplicates (for audit / logging, no-op in prod)
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY item_id, quantity, selling_price, DATE(date), COALESCE(sold_by::text, '__none__')
        ORDER BY created_at ASC
      ) AS rn
    FROM public.stationery_sales
  ) ranked
  WHERE rn > 1;

  RAISE NOTICE 'Duplicate stationery_sales rows to be deleted: %', dup_count;
END;
$$;

-- Step 2: Delete duplicate rows, keeping the OLDEST record per group.
-- A "duplicate" is defined as two or more rows with the same:
--   item_id + quantity + selling_price + calendar date + sold_by
-- This matches the pattern produced by the double-submit bug exactly.
DELETE FROM public.stationery_sales
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY item_id, quantity, selling_price, DATE(date), COALESCE(sold_by::text, '__none__')
        ORDER BY created_at ASC   -- keep the first submission
      ) AS rn
    FROM public.stationery_sales
  ) ranked
  WHERE rn > 1
);

-- Step 3: Add an expression index to help detect and prevent rapid re-submissions.
-- This unique index prevents the exact same sale (same item, qty, price, seller)
-- from being inserted twice within the same clock-minute, catching the case
-- where a cashier re-submits within seconds of a successful insert.
-- A legitimate re-sale of the same item by the same person one minute later is
-- still allowed — just enter a new transaction.
CREATE UNIQUE INDEX IF NOT EXISTS idx_stationery_sales_no_rapid_duplicate
  ON public.stationery_sales (
    item_id,
    quantity,
    selling_price,
    COALESCE(sold_by::text, '__none__'),
    date_trunc('minute', date)
  );

-- Step 4: Add a supporting index on DATE(date) to speed up the gte/lt date-range
-- queries now used in fetchData.
CREATE INDEX IF NOT EXISTS idx_stationery_sales_date_only
  ON public.stationery_sales (DATE(date));
