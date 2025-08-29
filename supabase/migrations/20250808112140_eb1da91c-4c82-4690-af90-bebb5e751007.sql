-- Remove frequency columns from all modules and current_stock where applicable
ALTER TABLE public.stationery DROP COLUMN IF EXISTS frequency, DROP COLUMN IF EXISTS current_stock;
ALTER TABLE public.gift_store DROP COLUMN IF EXISTS frequency, DROP COLUMN IF EXISTS current_stock;
ALTER TABLE public.embroidery DROP COLUMN IF EXISTS frequency;
ALTER TABLE public.machines DROP COLUMN IF EXISTS frequency;
ALTER TABLE public.art_services DROP COLUMN IF EXISTS frequency;

-- Drop enum type if no longer used
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'frequency_type' AND n.nspname = 'public'
  ) THEN
    -- already dropped
    NULL;
  ELSE
    -- ensure no remaining dependencies
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE udt_schema = 'public' AND udt_name = 'frequency_type'
    ) THEN
      DROP TYPE public.frequency_type;
    END IF;
  END IF;
END $$;