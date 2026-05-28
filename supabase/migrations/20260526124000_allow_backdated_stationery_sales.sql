-- =============================================================================
-- Allow back-dated stationery sales regardless of current stock.
--
-- Staff need to record sales they missed on previous days. The current-stock
-- value reflects TODAY, so a back-dated sale would be wrongly rejected by the
-- oversell pre-check even though the item physically sold on that past day.
--
-- This updates record_stationery_sale so the insufficient-stock check is only
-- enforced when the sale date is today or later. The AFTER-INSERT trigger
-- (reduce_stationery_stock_on_sale) clamps stock at GREATEST(0, ...), so a
-- back-dated sale can never push stock negative.
-- =============================================================================

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
  v_is_backdated boolean;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive' USING ERRCODE = '22023';
  END IF;

  -- A sale dated before today is a back-fill of a missed sale.
  v_is_backdated := (p_date::date < CURRENT_DATE);

  SELECT rate, stock
    INTO v_item_rate, v_current_stock
    FROM stationery
   WHERE id = p_item_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stationery item % not found', p_item_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Only block oversell for same-day / future sales. Back-dated entries are
  -- always allowed (trigger clamps stock at 0).
  IF NOT v_is_backdated AND v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock (% available, % requested)',
                    v_current_stock, p_quantity
      USING ERRCODE = 'P0001';
  END IF;

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
