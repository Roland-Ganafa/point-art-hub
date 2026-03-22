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
    didParseCell: (data) => {
      // Check if this is the last row and if it looks like a totals row
      // We can confidently assume the last row is totals based on our implementation
      if (data.row.index === tableRows.length - 1) {
        const firstCell = tableRows[data.row.index][0];
        if (firstCell && String(firstCell).includes('TOTALS')) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.textColor = [0, 0, 0];
        }
      }
    }
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
    category: 'Category',
    item_name: 'Item Name',
    description: 'Description',
    quantity: 'Qty',
    price: 'Price',
    cost: 'Cost',
    total_value: 'Total Value',
    supplier: 'Supplier',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => {
    const qty = item.stock || item.quantity || 0;
    const cost = item.cost || item.rate || 0;

    return {
      category: item.category,
      item_name: item.item_name || item.item,
      description: item.description || '-',
      quantity: qty,
      price: item.price || item.selling_price || 0,
      cost: cost,
      total_value: qty * cost,
      supplier: item.supplier || '-',
      created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    };
  });

  // Add Totals Row
  const totalQuantity = processedData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalSellingValue = processedData.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity) || 0), 0);
  const grandTotalValue = processedData.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);

  processedData.push({
    category: '',
    item_name: 'TOTALS',
    description: '',
    quantity: totalQuantity,
    price: totalSellingValue,
    cost: grandTotalValue,
    total_value: grandTotalValue,
    supplier: '',
    created_at: ''
  });

  return { headers, processedData };
};

// Prepare gift store data
export const prepareGiftStoreData = (data: any[]) => {
  const headers = {
    category: 'Category',
    item_name: 'Item Name',
    description: 'Description',
    quantity: 'Qty',
    price: 'Price (UGX)',
    cost: 'Cost (UGX)',
    created_at: 'Date Added'
  };

  const processedData = data.map(item => ({
    category: item.category ? (item.custom_category || item.category).replace(/_/g, ' ') : '-',
    item_name: item.item_name || item.item,
    description: item.description || '-',
    quantity: item.stock !== undefined ? item.stock : (item.quantity || 0),
    // selling_price is the correct field from gift_store table
    price: item.selling_price || item.price || item.spx || 0,
    // rate is the buying cost field from gift_store table
    cost: item.rate || item.cost || item.bpx || 0,
    created_at: item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  }));

  // Add Totals Row
  const totalQuantity = processedData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalSellingValue = processedData.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity) || 0), 0);
  const totalBuyingValue = processedData.reduce((sum, item) => sum + (Number(item.cost) * Number(item.quantity) || 0), 0);

  processedData.push({
    category: '',
    item_name: 'TOTALS',
    description: '',
    quantity: totalQuantity,
    price: totalSellingValue,
    cost: totalBuyingValue,
    created_at: ''
  });

  return { headers, processedData };
};

// Prepare embroidery data
export const prepareEmbroideryData = (data: any[], profilesMap?: Record<string, string>) => {
  const headers = {
    description: 'Description',
    cost: 'Cost',
    sales: 'Sales',
    profit: 'Profit',
    done_by: 'Done By',
    date_received: 'Received',
    time_recorded: 'Time Recorded'
  };

  const processedData = data.map(item => {
    // Resolve name: JOIN returns item.profiles.full_name, fallback to profilesMap or raw value
    const doneBy = item.profiles?.full_name || item.profiles?.sales_initials
      || (item.done_by ? (profilesMap?.[item.done_by] || item.done_by_name) : null)
      || '-';
    return {
      description: item.job_description || item.item_name || '-',
      cost: item.expenditure || 0,
      sales: item.sales || item.quotation || 0,
      profit: item.profit || 0,
      done_by: doneBy,
      date_received: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-',
      time_recorded: item.created_at ? format(new Date(item.created_at), 'HH:mm dd/MM/yyyy') : '-'
    };
  });

  // Add Totals Row
  const totalCost = processedData.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalSales = processedData.reduce((sum, item) => sum + (Number(item.sales) || 0), 0);
  const totalProfit = processedData.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);

  processedData.push({
    description: 'TOTALS',
    cost: totalCost,
    sales: totalSales,
    profit: totalProfit,
    done_by: '',
    date_received: '',
    time_recorded: ''
  });

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
    time_recorded: 'Time',
    done_by: 'Done By'
  };

  const processedData = data.map(item => ({
    machine_name: item.machine_name || item.machine_type || '-',
    service_description: item.service_description || item.description || '-',
    quantity: item.quantity,
    rate: item.rate,
    sales: (item.quantity * item.rate) || 0,
    expenditure: item.expenditure || 0,
    profit: ((item.quantity * item.rate) - (item.expenditure || 0)) || 0,
    date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-',
    time_recorded: item.created_at ? format(new Date(item.created_at), 'HH:mm') : '-',
    done_by: item.profiles?.full_name || item.profiles?.sales_initials || item.done_by_name || item.done_by || '-'
  }));

  // Add Totals Row
  const totalQuantity = processedData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalSales = processedData.reduce((sum, item) => sum + (Number(item.sales) || 0), 0);
  const totalExpenditure = processedData.reduce((sum, item) => sum + (Number(item.expenditure) || 0), 0);
  const totalProfit = processedData.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);

  processedData.push({
    machine_name: 'TOTALS',
    service_description: '',
    quantity: totalQuantity,
    rate: '',
    sales: totalSales,
    expenditure: totalExpenditure,
    profit: totalProfit,
    date: '',
    time_recorded: '',
    done_by: ''
  });

  return { headers, processedData };
};

// Prepare art services data
export const prepareArtServicesData = (data: any[]) => {
  const headers = {
    item: 'Item',
    description: 'Description',
    quantity: 'Qty',
    rate: 'Rate',
    amount: 'Amount',
    profit: 'Profit',
    date: 'Date',
    time_recorded: 'Time',
    done_by: 'Done By'
  };

  const processedData = data.map(item => ({
    item: item.service_name || '-',
    description: item.description || '-',
    quantity: item.quantity,
    rate: item.rate,
    amount: item.sales || (item.quantity * item.rate) || 0,
    profit: item.profit || ((item.quantity * item.rate) - (item.expenditure || 0)) || 0,
    date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-',
    time_recorded: item.created_at ? format(new Date(item.created_at), 'HH:mm') : '-',
    done_by: item.profiles?.full_name || item.profiles?.sales_initials || item.done_by_name || item.done_by || '-'
  }));

  // Add Totals Row
  const totalQuantity = processedData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = processedData.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalProfit = processedData.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);

  processedData.push({
    item: 'TOTALS',
    description: '',
    quantity: totalQuantity,
    rate: '',
    amount: totalAmount,
    profit: totalProfit,
    date: '',
    time_recorded: '',
    done_by: ''
  });

  return { headers, processedData };
};

// Prepare sales data
export const prepareSalesData = (data: any[]) => {
  const headers = {
    item: 'Item',
    description: 'Description',
    quantity: 'Qty',
    rate: 'Buying Price',
    selling_price: 'Selling Price',
    total: 'Total',
    profit: 'Profit',
    date: 'Date',
    time_recorded: 'Time',
    sold_by: 'Added By'
  };

  const processedData = data.map(item => {
    // Resolve item name: stationery sales join returns item.stationery.item
    let itemName = item.stationery?.item || item.item || '-';

    // For gift store sales which might be stored as "Category: Item"
    if (itemName && itemName.includes(': ')) {
      const parts = itemName.split(': ');
      if (parts.length > 1) itemName = parts.slice(1).join(': ');
    }

    // Resolve sold_by: JOIN returns item.profiles.full_name
    const soldBy = item.profiles?.full_name || item.profiles?.sales_initials || item.sold_by_name || '-';

    return {
      item: itemName,
      description: item.description || '-',
      quantity: item.quantity,
      rate: item.rate || item.bpx || 0,
      selling_price: item.selling_price || item.spx || 0,
      total: (item.selling_price || item.spx || 0) * item.quantity,
      profit: ((item.selling_price || item.spx || 0) - (item.rate || item.bpx || 0)) * item.quantity,
      date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : '-',
      time_recorded: item.created_at ? format(new Date(item.created_at), 'HH:mm') : '-',
      sold_by: soldBy
    };
  });

  // Add Totals Row
  const totalQuantity = processedData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalBuyingPrice = processedData.reduce((sum, item) => sum + (Number(item.rate) * Number(item.quantity) || 0), 0);
  const totalSellingPrice = processedData.reduce((sum, item) => sum + (Number(item.selling_price) * Number(item.quantity) || 0), 0);
  const grandTotal = processedData.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalProfit = processedData.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);

  processedData.push({
    item: 'TOTALS',
    description: '',
    quantity: totalQuantity,
    rate: totalBuyingPrice,
    selling_price: totalSellingPrice,
    total: grandTotal,
    profit: totalProfit,
    date: '',
    time_recorded: '',
    sold_by: ''
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

  // Add Totals Row
  const totalSpent = processedData.reduce((sum, item) => sum + (Number(item.total_spent) || 0), 0);

  processedData.push({
    full_name: 'TOTALS',
    phone: '',
    email: '',
    total_spent: totalSpent,
    last_visit: ''
  });

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

  // Add Totals Row
  const grandTotal = processedData.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

  processedData.push({
    invoice_number: 'TOTALS',
    customer_name: '',
    date_issued: '',
    due_date: '',
    total_amount: grandTotal,
    status: ''
  });

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