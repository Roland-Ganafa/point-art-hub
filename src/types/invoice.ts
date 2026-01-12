export interface Invoice {
    id: string;
    invoice_number: string;
    reference_number: string;
    customer_name: string;
    invoice_date: string;
    total_amount: number;
    amount_in_words: string | null;
    status: 'draft' | 'sent' | 'paid' | 'cancelled';
    notes: string | null;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    updated_by: string | null;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    serial_number: number;
    particulars: string;
    description: string | null;
    quantity: number;
    rate: number;
    amount: number;
    created_at: string;
}

export interface InvoiceWithItems extends Invoice {
    items: InvoiceItem[];
}

export interface InvoiceFormData {
    customer_name: string;
    invoice_date: string;
    notes: string;
    items: Array<{
        particulars: string;
        description: string;
        quantity: number;
        rate: number;
    }>;
}
