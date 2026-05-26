-- Transactional invoice save (header + line items).
-- Fixes bug where the edit flow could leave an invoice with zero line items
-- if the items-insert step failed after items-delete succeeded.
--
-- Usage from client:
--   supabase.rpc('save_invoice_with_items', {
--     p_invoice_id: null,      -- null => create, uuid => update
--     p_customer_name, p_invoice_date, p_notes, p_user_id,
--     p_items: jsonb_array_of_line_items
--   })
-- Returns the invoice row (with generated invoice_number on insert).

CREATE OR REPLACE FUNCTION public.save_invoice_with_items(
  p_invoice_id   uuid,
  p_customer_name text,
  p_invoice_date  date,
  p_notes         text,
  p_user_id       uuid,
  p_items         jsonb        -- [{ particulars, description, quantity, rate }]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice       jsonb;
  v_invoice_id    uuid;
  v_invoice_no    text;
  v_ref_no        text;
  v_total         numeric := 0;
  v_item          jsonb;
  v_idx           integer := 0;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Invoice must have at least one line item'
      USING ERRCODE = '22023';
  END IF;

  -- Compute total from authoritative line-item math (don't trust client)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_total := v_total
      + COALESCE((v_item->>'quantity')::numeric, 0)
      * COALESCE((v_item->>'rate')::numeric, 0);
  END LOOP;

  IF p_invoice_id IS NULL THEN
    -- INSERT path: allocate numbers and create the invoice row
    SELECT public.get_next_invoice_number()   INTO v_invoice_no;
    SELECT public.get_next_reference_number() INTO v_ref_no;

    INSERT INTO invoices (
      invoice_number, reference_number, customer_name, invoice_date,
      total_amount, status, notes, created_by, updated_by
    ) VALUES (
      v_invoice_no, v_ref_no, p_customer_name, p_invoice_date,
      v_total, 'draft', p_notes, p_user_id, p_user_id
    )
    RETURNING id INTO v_invoice_id;
  ELSE
    -- UPDATE path: update header + clear old line items
    UPDATE invoices
       SET customer_name = p_customer_name,
           invoice_date  = p_invoice_date,
           total_amount  = v_total,
           notes         = p_notes,
           updated_by    = p_user_id,
           updated_at    = NOW()
     WHERE id = p_invoice_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invoice % not found', p_invoice_id
        USING ERRCODE = 'P0002';
    END IF;

    v_invoice_id := p_invoice_id;

    DELETE FROM invoice_items WHERE invoice_id = v_invoice_id;
  END IF;

  -- Insert the new line items (same transaction; rolled back atomically on error)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_idx := v_idx + 1;
    INSERT INTO invoice_items (
      invoice_id, serial_number, particulars, description,
      quantity, rate, amount
    ) VALUES (
      v_invoice_id,
      v_idx,
      v_item->>'particulars',
      v_item->>'description',
      COALESCE((v_item->>'quantity')::numeric, 0),
      COALESCE((v_item->>'rate')::numeric, 0),
      COALESCE((v_item->>'quantity')::numeric, 0)
        * COALESCE((v_item->>'rate')::numeric, 0)
    );
  END LOOP;

  -- Return the saved invoice
  SELECT to_jsonb(i) INTO v_invoice
    FROM invoices i WHERE i.id = v_invoice_id;

  RETURN v_invoice;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_invoice_with_items(
  uuid, text, date, text, uuid, jsonb
) TO authenticated;
