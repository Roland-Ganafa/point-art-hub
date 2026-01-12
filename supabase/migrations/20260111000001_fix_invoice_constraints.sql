-- Fix foreign key constraint issue by making created_by and updated_by optional
-- This allows invoices to be created even if the user profile doesn't exist yet

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_updated_by_fkey;

-- Make the columns nullable
ALTER TABLE invoices ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE invoices ALTER COLUMN updated_by DROP NOT NULL;
