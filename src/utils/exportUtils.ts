import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Utility functions for data export (CSV/Excel/PDF)

interface ExportOptions {
  filename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeTimestamp?: boolean;
  customHeaders?: Record<string, string>;
  format?: 'csv' | 'pdf';
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

// Generate PDF from data
export const generatePDF = (data: ExportData[], headers: Record<string, string>, title: string, filename: string): void => {
  const doc = new jsPDF();

  const tableColumn = Object.values(headers);
  const tableKeys = Object.keys(headers);

  const tableRows = data.map(item => {
    return tableKeys.map(key => {
      const value = item[key];
      return value === null || value === undefined ? '' : String(value);
    });
  });

  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 22);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 66, 66] },
  });

  doc.save(filename);
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

// Prepare stationery data
export const prepareStationeryData = (data: any[]) => {
  const headers = {
    item_name: 'Item Name',
    category: 'Category',
    quantity: 'Qty',
    price: 'Price',
    cost: 'Cost',
    supplier: 'Supplier',
    description: 'Description',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    item_name: item.item_name || item.item,
    category: item.category,
    quantity: item.stock || item.quantity || 0,
    price: item.price || item.selling_price || 0,
    cost: item.cost || item.rate || 0,
    supplier: item.supplier || '-',
    description: item.description || '-',
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }));

  return { headers, processedData };
};

// Prepare gift store data
export const prepareGiftStoreData = (data: any[]) => {
  const headers = {
    item_name: 'Item Name', // Changed so it matches key in processedData if needed, but keeping labels
    category: 'Category',
    quantity: 'Qty',
    price: 'Price',
    cost: 'Cost',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    item_name: item.item_name || item.item,
    category: item.category,
    quantity: item.stock || item.quantity || 0,
    price: item.price || item.spx || 0,
    cost: item.cost || item.bpx || 0,
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }));

  return { headers, processedData };
};

// Prepare embroidery data
export const prepareEmbroideryData = (data: any[]) => {
  const headers = {
    client_name: 'Client',
    service_type: 'Service',
    description: 'Description',
    cost: 'Cost',
    sales: 'Sales',
    profit: 'Profit',
    status: 'Status',
    date_received: 'Received',
    date_completed: 'Completed'
  };

  const processedData = data.map(item => ({
    client_name: item.client_name,
    service_type: item.service_type,
    description: item.description,
    cost: item.cost || 0,
    sales: item.sales || 0,
    profit: item.profit || 0,
    status: item.status,
    date_received: item.date_received ? format(new Date(item.date_received), 'yyyy-MM-dd') : '-',
    date_completed: item.date_completed ? format(new Date(item.date_completed), 'yyyy-MM-dd') : '-'
  }));

  return { headers, processedData };
};

// Prepare machines data
export const prepareMachinesData = (data: any[]) => {
  const headers = {
    machine_name: 'Machine',
    service_description: 'Service',
    quantity: 'Qty',
    rate: 'Rate',
    sales: 'Sales',
    expenditure: 'Exp',
    profit: 'Profit',
    date: 'Date',
    done_by: 'Done By'
  };

  const processedData = data.map(item => ({
    machine_name: item.machine_name,
    service_description: item.service_description,
    quantity: item.quantity,
    rate: item.rate,
    sales: (item.quantity * item.rate) || 0,
    expenditure: item.expenditure || 0,
    profit: ((item.quantity * item.rate) - (item.expenditure || 0)) || 0,
    date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-',
    done_by: item.done_by || '-'
  }));

  return { headers, processedData };
};

// Prepare art services data
export const prepareArtServicesData = (data: any[]) => {
  const headers = {
    item: 'Item',
    description: 'Description',
    quantity: 'Qty',
    rate: 'rate',
    amount: 'Amount',
    profit: 'Profit',
    date: 'Date'
  };

  const processedData = data.map(item => ({
    item: item.item,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    profit: item.profit,
    date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-'
  }));

  return { headers, processedData };
};

// Prepare sales data
export const prepareSalesData = (data: any[]) => {
  const headers = {
    item: 'Item',
    category: 'Category',
    quantity: 'Qty',
    rate: 'rate',
    selling_price: 'Price',
    total: 'Total',
    profit: 'Profit',
    date: 'Date',
    sold_by: 'Added By'
  };

  const processedData = data.map(item => {
    // Determine item name, handling possible joined string format "Category: Item"
    let itemName = item.item;
    let categoryName = item.category || '-';

    // For gift store sales which might be stored as "Category: Item"
    if (item.current_stock === undefined && item.item && item.item.includes(': ')) {
      const parts = item.item.split(': ');
      if (parts.length > 1) {
        categoryName = parts[0];
        itemName = parts.slice(1).join(': ');
      }
    }

    return {
      item: itemName,
      category: categoryName,
      quantity: item.quantity,
      rate: item.rate || item.bpx || 0,
      selling_price: item.selling_price || item.spx || 0,
      total: (item.selling_price || item.spx || 0) * item.quantity,
      profit: ((item.selling_price || item.spx || 0) - (item.rate || item.bpx || 0)) * item.quantity,
      date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-',
      sold_by: item.sold_by || '-'
    };
  });

  return { headers, processedData };
};

// Prepare customers data
export const prepareCustomersData = (data: any[]) => {
  const headers = {
    full_name: 'Name',
    phone: 'Phone',
    email: 'Email',
    total_spent: 'Total Spent',
    last_visit: 'Last Visit'
  };

  const processedData = data.map(item => ({
    full_name: item.full_name,
    phone: item.phone || '-',
    email: item.email || '-',
    total_spent: item.total_spent || 0,
    last_visit: item.last_visit ? format(new Date(item.last_visit), 'yyyy-MM-dd') : '-'
  }));

  return { headers, processedData };
};

// Prepare invoices data
export const prepareInvoicesData = (data: any[]) => {
  const headers = {
    invoice_number: 'Inv #',
    customer_name: 'Customer',
    date_issued: 'Issued',
    due_date: 'Due',
    total_amount: 'Total',
    status: 'Status'
  };

  const processedData = data.map(item => ({
    invoice_number: item.invoice_number,
    customer_name: item.customer?.full_name || item.customer_name || 'Walk-in',
    date_issued: item.date_issued ? format(new Date(item.date_issued), 'yyyy-MM-dd') : '-',
    due_date: item.due_date ? format(new Date(item.due_date), 'yyyy-MM-dd') : '-',
    total_amount: item.total_amount || 0,
    status: item.status
  }));

  return { headers, processedData };
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
    const dateField = type === 'sales' || type === 'machines' || type === 'art_services' || type === 'invoices' ? 'date' : 'created_at';
    // Special handling for different date field names across modules
    let actualDateField = dateField;
    if (type === 'invoices') actualDateField = 'date_issued';
    if (type === 'sales' && !data[0]?.date && data[0]?.sale_date) actualDateField = 'sale_date';

    filteredData = filterDataByDateRange(
      data,
      actualDateField,
      options.dateRange.start,
      options.dateRange.end
    );
  }

  let prepared: { headers: Record<string, string>, processedData: any[] };

  switch (type) {
    case 'stationery':
      prepared = prepareStationeryData(filteredData);
      break;
    case 'gift_store':
      prepared = prepareGiftStoreData(filteredData);
      break;
    case 'embroidery':
      prepared = prepareEmbroideryData(filteredData);
      break;
    case 'machines':
      prepared = prepareMachinesData(filteredData);
      break;
    case 'art_services':
      prepared = prepareArtServicesData(filteredData);
      break;
    case 'sales':
      prepared = prepareSalesData(filteredData);
      break;
    case 'customers':
      prepared = prepareCustomersData(filteredData);
      break;
    case 'invoices':
      prepared = prepareInvoicesData(filteredData);
      break;
    case 'custom':
      prepared = {
        headers: options.customHeaders || {},
        processedData: filteredData
      };
      break;
    default:
      throw new Error(`Unsupported export type: ${type}`);
  }

  const timestamp = options.includeTimestamp ? `-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}` : '';
  const baseFilename = options.filename || `${type.replace('_', '-')}-export${timestamp}`;

  if (options.format === 'pdf') {
    generatePDF(
      prepared.processedData,
      prepared.headers,
      `${type.replace('_', ' ').toUpperCase()} Report`,
      `${baseFilename}.pdf`
    );
  } else {
    // Default to CSV
    const csvContent = convertToCSV(prepared.processedData, prepared.headers);
    downloadCSV(csvContent, `${baseFilename}.csv`);
  }
};