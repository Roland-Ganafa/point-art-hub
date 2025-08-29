-- Create customers table for customer management
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company TEXT,
  customer_type TEXT DEFAULT 'individual' CHECK (customer_type IN ('individual', 'business', 'wholesale')),
  
  -- Financial tracking
  total_purchases DECIMAL(10,2) DEFAULT 0,
  outstanding_balance DECIMAL(10,2) DEFAULT 0,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  
  -- Contact preferences
  preferred_contact TEXT DEFAULT 'phone' CHECK (preferred_contact IN ('phone', 'email', 'sms')),
  marketing_consent BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization
  last_purchase_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT customers_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT customers_phone_format CHECK (phone IS NULL OR LENGTH(phone) >= 10)
);

-- Create customer_transactions table for purchase history
CREATE TABLE IF NOT EXISTS public.customer_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'return', 'payment', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'credit')),
  
  -- Related records
  sale_id UUID, -- Reference to specific sale records
  invoice_number TEXT,
  receipt_number TEXT,
  
  -- Items (JSON array for flexibility)
  items JSONB,
  
  -- Transaction metadata
  description TEXT,
  notes TEXT,
  processed_by UUID REFERENCES public.profiles(id),
  
  -- Timestamps
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Anyone can view customers" 
ON public.customers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert customers" 
ON public.customers FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers FOR DELETE 
TO authenticated USING (true);

-- Create policies for customer_transactions
CREATE POLICY "Anyone can view customer_transactions" 
ON public.customer_transactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert customer_transactions" 
ON public.customer_transactions FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customer_transactions" 
ON public.customer_transactions FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete customer_transactions" 
ON public.customer_transactions FOR DELETE 
TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON public.customers(email) WHERE email IS NOT NULL;
CREATE INDEX idx_customers_phone ON public.customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_customers_full_name ON public.customers(full_name);
CREATE INDEX idx_customers_customer_type ON public.customers(customer_type);
CREATE INDEX idx_customers_last_purchase_date ON public.customers(last_purchase_date);
CREATE INDEX idx_customers_created_at ON public.customers(created_at);

CREATE INDEX idx_customer_transactions_customer_id ON public.customer_transactions(customer_id);
CREATE INDEX idx_customer_transactions_type ON public.customer_transactions(transaction_type);
CREATE INDEX idx_customer_transactions_date ON public.customer_transactions(transaction_date);
CREATE INDEX idx_customer_transactions_amount ON public.customer_transactions(amount);

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_transactions_updated_at 
    BEFORE UPDATE ON public.customer_transactions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update customer totals
CREATE OR REPLACE FUNCTION public.update_customer_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer's total purchases and last purchase date
    IF NEW.transaction_type = 'sale' THEN
        UPDATE public.customers 
        SET 
            total_purchases = COALESCE(total_purchases, 0) + NEW.amount,
            last_purchase_date = CURRENT_DATE
        WHERE id = NEW.customer_id;
    ELSIF NEW.transaction_type = 'payment' THEN
        UPDATE public.customers 
        SET outstanding_balance = COALESCE(outstanding_balance, 0) - NEW.amount
        WHERE id = NEW.customer_id;
    ELSIF NEW.transaction_type = 'return' OR NEW.transaction_type = 'refund' THEN
        UPDATE public.customers 
        SET total_purchases = COALESCE(total_purchases, 0) - NEW.amount
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer totals
CREATE TRIGGER trigger_update_customer_totals
    AFTER INSERT ON public.customer_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_customer_totals();

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.customer_transactions TO authenticated;