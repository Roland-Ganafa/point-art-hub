 -- Add description column to gift_store table
ALTER TABLE public.gift_store 
ADD COLUMN IF NOT EXISTS description TEXT;