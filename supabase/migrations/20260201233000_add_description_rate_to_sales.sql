-- Add missing columns to stationery_sales table
ALTER TABLE public.stationery_sales ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.stationery_sales ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2);

-- Update existing records if item_id matches stationery table (optional but helpful)
-- This will populate historical records with their current inventory counterparts
UPDATE public.stationery_sales s
SET 
  description = st.description,
  rate = st.rate
FROM public.stationery st
WHERE s.item_id = st.id
AND (s.description IS NULL OR s.rate IS NULL);
