-- Add missing columns to embroidery table for better reporting
ALTER TABLE public.embroidery
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Delivered')),
ADD COLUMN IF NOT EXISTS date_completed DATE,
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Create index for status to improve filtering performance
CREATE INDEX IF NOT EXISTS idx_embroidery_status ON public.embroidery(status);
