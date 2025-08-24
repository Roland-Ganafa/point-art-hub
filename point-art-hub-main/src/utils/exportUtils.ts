import { format } from 'date-fns';

// Utility functions for data export (CSV/Excel)

interface ExportOptions {
  filename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeTimestamp?: boolean;
  customHeaders?: Record<string, string>;
}

interface ExportData {
  [key: string]: any;
}

// Convert data to CSV format
export const convertToCSV = (data: ExportData[], headers?: Record<string, string>): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get all unique keys from data
  const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
  
  // Use custom headers if provided, otherwise use original keys
  const displayHeaders = headers ? 
    allKeys.map(key => headers[key] || key) : 
    allKeys;

  // Create CSV header row
  const csvHeaders = displayHeaders.join(',');

  // Create CSV data rows
  const csvRows = data.map(row => {
    return allKeys.map(key => {
      const value = row[key];
      if (value === null || value === undefined) {
        return '';
      }
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

// Download CSV file
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Export stationery data
export const exportStationeryData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    item_name: 'Item Name',
    category: 'Category',
    price: 'Price (UGX)',
    cost: 'Cost (UGX)',
    stock_quantity: 'Stock Quantity',
    min_stock_level: 'Minimum Stock Level',
    supplier: 'Supplier',
    description: 'Description',
    created_at: 'Date Added',
    updated_at: 'Last Updated'
  };

  const processedData = data.map(item => ({
    ...item,
    price: item.price ? `UGX ${item.price.toLocaleString()}` : 'UGX 0',
    cost: item.cost ? `UGX ${item.cost.toLocaleString()}` : 'UGX 0',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
    updated_at: item.updated_at ? format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `stationery-inventory${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export gift store data
export const exportGiftStoreData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    item_name: 'Item Name',
    category: 'Category',
    price: 'Price (UGX)',
    cost: 'Cost (UGX)',
    stock_quantity: 'Stock Quantity',
    supplier: 'Supplier',
    description: 'Description',
    created_at: 'Date Added',
    updated_at: 'Last Updated'
  };

  const processedData = data.map(item => ({
    ...item,
    price: item.price ? `UGX ${item.price.toLocaleString()}` : 'UGX 0',
    cost: item.cost ? `UGX ${item.cost.toLocaleString()}` : 'UGX 0',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
    updated_at: item.updated_at ? format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `gift-store-inventory${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export embroidery data
export const exportEmbroideryData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    client_name: 'Client Name',
    contact_info: 'Contact Info',
    service_type: 'Service Type',
    description: 'Description',
    cost: 'Cost (UGX)',
    sales: 'Sales (UGX)',
    profit: 'Profit (UGX)',
    expenditure: 'Expenditure (UGX)',
    status: 'Status',
    date_received: 'Date Received',
    date_completed: 'Date Completed',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    ...item,
    cost: item.cost ? `UGX ${item.cost.toLocaleString()}` : 'UGX 0',
    sales: item.sales ? `UGX ${item.sales.toLocaleString()}` : 'UGX 0',
    profit: item.profit ? `UGX ${item.profit.toLocaleString()}` : 'UGX 0',
    expenditure: item.expenditure ? `UGX ${item.expenditure.toLocaleString()}` : 'UGX 0',
    date_received: item.date_received ? format(new Date(item.date_received), 'yyyy-MM-dd') : '',
    date_completed: item.date_completed ? format(new Date(item.date_completed), 'yyyy-MM-dd') : '',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `embroidery-services${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export machines data
export const exportMachinesData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    client_name: 'Client Name',
    contact_info: 'Contact Info',
    service_type: 'Service Type',
    description: 'Description',
    cost: 'Cost (UGX)',
    sales: 'Sales (UGX)',
    expenditure: 'Expenditure (UGX)',
    profit: 'Profit (UGX)',
    status: 'Status',
    date_received: 'Date Received',
    date_completed: 'Date Completed',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    ...item,
    cost: item.cost ? `UGX ${item.cost.toLocaleString()}` : 'UGX 0',
    sales: item.sales ? `UGX ${item.sales.toLocaleString()}` : 'UGX 0',
    expenditure: item.expenditure ? `UGX ${item.expenditure.toLocaleString()}` : 'UGX 0',
    profit: ((item.sales || 0) - (item.expenditure || 0)) > 0 ? 
      `UGX ${((item.sales || 0) - (item.expenditure || 0)).toLocaleString()}` : 'UGX 0',
    date_received: item.date_received ? format(new Date(item.date_received), 'yyyy-MM-dd') : '',
    date_completed: item.date_completed ? format(new Date(item.date_completed), 'yyyy-MM-dd') : '',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `machine-services${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export art services data
export const exportArtServicesData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    client_name: 'Client Name',
    contact_info: 'Contact Info',
    service_type: 'Service Type',
    description: 'Description',
    cost: 'Cost (UGX)',
    sales: 'Sales (UGX)',
    profit: 'Profit (UGX)',
    expenditure: 'Expenditure (UGX)',
    deposit: 'Deposit (UGX)',
    status: 'Status',
    date_received: 'Date Received',
    date_completed: 'Date Completed',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    ...item,
    cost: item.cost ? `UGX ${item.cost.toLocaleString()}` : 'UGX 0',
    sales: item.sales ? `UGX ${item.sales.toLocaleString()}` : 'UGX 0',
    profit: item.profit ? `UGX ${item.profit.toLocaleString()}` : 'UGX 0',
    expenditure: item.expenditure ? `UGX ${item.expenditure.toLocaleString()}` : 'UGX 0',
    deposit: item.deposit ? `UGX ${item.deposit.toLocaleString()}` : 'UGX 0',
    date_received: item.date_received ? format(new Date(item.date_received), 'yyyy-MM-dd') : '',
    date_completed: item.date_completed ? format(new Date(item.date_completed), 'yyyy-MM-dd') : '',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `art-services${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export sales data
export const exportSalesData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    item_name: 'Item Name',
    quantity: 'Quantity Sold',
    unit_price: 'Unit Price (UGX)',
    total_amount: 'Total Amount (UGX)',
    profit: 'Profit (UGX)',
    customer_name: 'Customer Name',
    payment_method: 'Payment Method',
    sales_person: 'Sales Person',
    sale_date: 'Sale Date',
    created_at: 'Date Recorded'
  };

  const processedData = data.map(item => ({
    ...item,
    unit_price: item.unit_price ? `UGX ${item.unit_price.toLocaleString()}` : 'UGX 0',
    total_amount: item.total_amount ? `UGX ${item.total_amount.toLocaleString()}` : 'UGX 0',
    profit: item.profit ? `UGX ${item.profit.toLocaleString()}` : 'UGX 0',
    sale_date: item.sale_date ? format(new Date(item.sale_date), 'yyyy-MM-dd') : '',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `sales-data${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export customers data
export const exportCustomersData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    full_name: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    company: 'Company',
    customer_type: 'Customer Type',
    total_purchases: 'Total Purchases (UGX)',
    outstanding_balance: 'Outstanding Balance (UGX)',
    credit_limit: 'Credit Limit (UGX)',
    preferred_contact: 'Preferred Contact',
    marketing_consent: 'Marketing Consent',
    last_purchase_date: 'Last Purchase Date',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    ...item,
    total_purchases: item.total_purchases ? `UGX ${item.total_purchases.toLocaleString()}` : 'UGX 0',
    outstanding_balance: item.outstanding_balance ? `UGX ${item.outstanding_balance.toLocaleString()}` : 'UGX 0',
    credit_limit: item.credit_limit ? `UGX ${item.credit_limit.toLocaleString()}` : 'UGX 0',
    marketing_consent: item.marketing_consent ? 'Yes' : 'No',
    last_purchase_date: item.last_purchase_date ? format(new Date(item.last_purchase_date), 'yyyy-MM-dd') : 'Never',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `customers-data${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Export invoices data
export const exportInvoicesData = async (
  data: any[], 
  options: ExportOptions = {}
): Promise<void> => {
  const headers = {
    id: 'ID',
    invoice_number: 'Invoice Number',
    customer_name: 'Customer Name',
    customer_company: 'Customer Company',
    issue_date: 'Issue Date',
    due_date: 'Due Date',
    status: 'Status',
    subtotal: 'Subtotal (UGX)',
    tax_amount: 'Tax Amount (UGX)',
    discount: 'Discount (UGX)',
    total: 'Total (UGX)',
    items_count: 'Number of Items',
    created_at: 'Date Created'
  };

  const processedData = data.map(item => ({
    id: item.id,
    invoice_number: item.invoice_number,
    customer_name: item.customer?.full_name || '',
    customer_company: item.customer?.company || '',
    issue_date: item.issue_date ? format(new Date(item.issue_date), 'yyyy-MM-dd') : '',
    due_date: item.due_date ? format(new Date(item.due_date), 'yyyy-MM-dd') : '',
    status: item.status,
    subtotal: item.subtotal ? `UGX ${item.subtotal.toLocaleString()}` : 'UGX 0',
    tax_amount: item.tax_amount ? `UGX ${item.tax_amount.toLocaleString()}` : 'UGX 0',
    discount: item.discount ? `UGX ${item.discount.toLocaleString()}` : 'UGX 0',
    total: item.total ? `UGX ${item.total.toLocaleString()}` : 'UGX 0',
    items_count: item.items?.length || 0,
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm:ss') : ''
  }));

  const csvContent = convertToCSV(processedData, { ...headers, ...options.customHeaders });
  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const filename = options.filename || `invoices-data${timestamp}.csv`;
  
  downloadCSV(csvContent, filename);
};

// Filter data by date range
export const filterDataByDateRange = (
  data: any[], 
  dateField: string = 'created_at',
  startDate?: Date,
  endDate?: Date
): any[] => {
  if (!startDate && !endDate) {
    return data;
  }

  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    
    if (startDate && itemDate < startDate) {
      return false;
    }
    
    if (endDate && itemDate > endDate) {
      return false;
    }
    
    return true;
  });
};

// General export function that can handle any data type
export const exportData = async (
  data: any[],
  type: 'stationery' | 'gift_store' | 'embroidery' | 'machines' | 'art_services' | 'sales' | 'customers' | 'invoices' | 'custom',
  options: ExportOptions = {}
): Promise<void> => {
  // Filter data by date range if specified
  let filteredData = data;
  if (options.dateRange) {
    const dateField = type === 'sales' ? 'sale_date' : 'created_at';
    filteredData = filterDataByDateRange(
      data, 
      dateField, 
      options.dateRange.start, 
      options.dateRange.end
    );
  }

  switch (type) {
    case 'stationery':
      return exportStationeryData(filteredData, options);
    case 'gift_store':
      return exportGiftStoreData(filteredData, options);
    case 'embroidery':
      return exportEmbroideryData(filteredData, options);
    case 'machines':
      return exportMachinesData(filteredData, options);
    case 'art_services':
      return exportArtServicesData(filteredData, options);
    case 'sales':
      return exportSalesData(filteredData, options);
    case 'customers':
      return exportCustomersData(filteredData, options);
    case 'invoices':
      return exportInvoicesData(filteredData, options);
    case 'custom':
      const csvContent = convertToCSV(filteredData, options.customHeaders);
      const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
      const filename = options.filename || `custom-export${timestamp}.csv`;
      downloadCSV(csvContent, filename);
      break;
    default:
      throw new Error(`Unsupported export type: ${type}`);
  }
};