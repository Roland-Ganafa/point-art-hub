-- Add category field to stationery table
ALTER TABLE public.stationery 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Office Supplies';

-- Create index for category field
CREATE INDEX IF NOT EXISTS idx_stationery_category ON public.stationery(category);

-- Update existing records to have a default category if null
UPDATE public.stationery 
SET category = 'Office Supplies' 
WHERE category IS NULL;