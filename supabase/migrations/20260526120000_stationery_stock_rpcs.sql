-- Atomic stock adjustment for stationery items.
-- Fixes the bug where stationery.stock was never decremented on sale,
-- could be negative due to race conditions, or was reset by edits.
--
-- Usage from client:
--   supabase.rpc('record_stationery_sale', { p_payload: {...} })
--   supabase.rpc('adjust_stationery_stock', { p_item_id, p_delta })
--
-- p_delta is the amount to SUBTRACT from stock:
--   * sale recorded   ->  p_delta = +quantity  (stock decreases)
--   * sale deleted    ->  p_delta = -quantity  (stock restored)
--   * sale edited     ->  p_delta = newQty - oldQty

------------------------------------------------------------
-- 1. Atomic stock adjustment (race-safe, rejects oversell)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_stationery_stock(
  p_item_id uuid,
  p_delta integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_stock integer;
BEGIN
  UPDATE stationery
     SET stock = stock - p_delta,
         updated_at = NOW()
   WHERE id = p_item_id
   RETURNING stock INTO v_new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stationery item % not found', p_item_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_new_stock < 0 THEN
    -- Function's implicit transaction rolls back the UPDATE on RAISE
    RAISE EXCEPTION 'Insufficient stock (would result in %)', v_new_stock
      USING ERRCODE = 'P0001';
  END IF;

  RETURN v_new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_stationery_stock(uuid, integer)
  TO authenticated;

------------------------------------------------------------
-- 2. Record a sale (stock decrement handled by existing trigger
--    trg_reduce_stationery_stock_on_sale from migration 20250910000001)
--
-- This RPC's job is to:
--   * pre-check stock and reject oversell (no CHECK constraint on stock,
--     and the AFTER-INSERT trigger silently allows negative)
--   * read the authoritative rate from inventory (bug #3 — block profit
--     inflation via user-typed rate)
--   * compute profit/total in one place, server-side
--
-- The trigger fires AFTER INSERT in the same transaction, so atomicity
-- is preserved.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_stationery_sale(
  p_item_id uuid,
  p_quantity integer,
  p_selling_price numeric,
  p_description text,
  p_sold_by uuid,
  p_date timestamptz
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id uuid;
  v_item_rate numeric;
  v_current_stock integer;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive' USING ERRCODE = '22023';
  END IF;

  -- Lock the row so concurrent sales see a consistent stock value
  SELECT rate, stock
    INTO v_item_rate, v_current_stock
    FROM stationery
   WHERE id = p_item_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stationery item % not found', p_item_id
      USING ERRCODE = 'P0002';
  END IF;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock (% available, % requested)',
                    v_current_stock, p_quantity
      USING ERRCODE = 'P0001';
  END IF;

  -- Insert. The AFTER-INSERT trigger trg_reduce_stationery_stock_on_sale
  -- will decrement stock by p_quantity within this same transaction.
  INSERT INTO stationery_sales (
    item_id, quantity, selling_price, rate, profit,
    total_amount, description, sold_by, date
  ) VALUES (
    p_item_id,
    p_quantity,
    p_selling_price,
    v_item_rate,
    (p_selling_price - v_item_rate) * p_quantity,
    p_selling_price * p_quantity,
    NULLIF(TRIM(p_description), ''),
    p_sold_by,
    p_date
  )
  RETURNING id INTO v_sale_id;

  RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_stationery_sale(
  uuid, integer, numeric, text, uuid, timestamptz
) TO authenticated;
