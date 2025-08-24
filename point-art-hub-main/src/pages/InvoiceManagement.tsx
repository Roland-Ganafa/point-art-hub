import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Calendar,
  DollarSign,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useSettings } from '@/contexts/SettingsContext';

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer: Customer;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: "",
    due_date: "",
    notes: "",
    terms: "Payment is due within 30 days of invoice date.",
    discount: "",
    items: [{ description: "", quantity: 1, rate: 0 }] as Array<{
      description: string;
      quantity: number;
      rate: number;
    }>
  });

  const { toast } = useToast();
  const { isAdmin, profile } = useUser();
  const { settings } = useSettings();

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      // For now, we'll create mock data since we don't have invoices table
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoice_number: 'INV-2024-001',
          customer_id: '1',
          customer: {
            id: '1',
            full_name: 'John Doe',
            email: 'john@example.com',
            phone: '+256700123456',
            address: 'Kampala, Uganda',
            company: 'ABC Company'
          },
          issue_date: '2024-08-20',
          due_date: '2024-09-20',
          status: 'sent',
          subtotal: 150000,
          tax_rate: 18,
          tax_amount: 27000,
          discount: 5000,
          total: 172000,
          notes: 'Thank you for your business!',
          terms: 'Payment is due within 30 days of invoice date.',
          items: [
            {
              id: '1',
              description: 'Stationery Package',
              quantity: 2,
              rate: 50000,
              amount: 100000
            },
            {
              id: '2',
              description: 'Custom Design Service',
              quantity: 1,
              rate: 50000,
              amount: 50000
            }
          ],
          created_at: '2024-08-20T10:00:00Z',
          updated_at: '2024-08-20T10:00:00Z'
        },
        {
          id: '2',
          invoice_number: 'INV-2024-002',
          customer_id: '2',
          customer: {
            id: '2',
            full_name: 'Sarah Smith',
            email: 'sarah@example.com',
            phone: '+256700654321',
            address: 'Entebbe, Uganda',
            company: null
          },
          issue_date: '2024-08-22',
          due_date: '2024-09-22',
          status: 'paid',
          subtotal: 75000,
          tax_rate: 18,
          tax_amount: 13500,
          discount: 0,
          total: 88500,
          notes: 'Great working with you!',
          terms: 'Payment is due within 30 days of invoice date.',
          items: [
            {
              id: '3',
              description: 'Printing Services',
              quantity: 100,
              rate: 750,
              amount: 75000
            }
          ],
          created_at: '2024-08-22T14:30:00Z',
          updated_at: '2024-08-22T14:30:00Z'
        }
      ];
      
      setInvoices(mockInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Try to fetch from customers table, but fall back to mock data if it doesn't exist
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, full_name, email, phone, address, company')
          .order('full_name');

        if (error) throw error;
        
        if (data && data.length > 0) {
          setCustomers(data);
          return;
        }
      } catch (dbError) {
        console.log('Customers table not available, using mock data');
      }
      
      // Use mock data if database table doesn't exist or is empty
      setCustomers([
        {
          id: '1',
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '+256700123456',
          address: 'Kampala, Uganda',
          company: 'ABC Company'
        },
        {
          id: '2',
          full_name: 'Sarah Smith',
          email: 'sarah@example.com',
          phone: '+256700654321',
          address: 'Entebbe, Uganda',
          company: null
        },
        {
          id: '3',
          full_name: 'Michael Johnson',
          email: 'michael@business.com',
          phone: '+256700789012',
          address: 'Jinja, Uganda',
          company: 'Tech Solutions Ltd'
        }
      ]);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const nextNumber = invoices.length + 1;
    return `INV-${year}-${nextNumber.toString().padStart(3, '0')}`;
  };

  const calculateItemAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  const calculateSubtotal = (items: typeof invoiceForm.items) => {
    return items.reduce((sum, item) => sum + calculateItemAmount(item.quantity, item.rate), 0);
  };

  const addInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, rate: 0 }]
    }));
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotal = calculateSubtotal(invoiceForm.items);
    const discount = parseFloat(invoiceForm.discount) || 0;
    const taxRate = settings.taxRate || 18;
    const taxAmount = ((subtotal - discount) * taxRate) / 100;
    const total = subtotal - discount + taxAmount;

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoice_number: generateInvoiceNumber(),
      customer_id: invoiceForm.customer_id,
      customer: customers.find(c => c.id === invoiceForm.customer_id)!,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: invoiceForm.due_date,
      status: 'draft',
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount,
      total,
      notes: invoiceForm.notes,
      terms: invoiceForm.terms,
      items: invoiceForm.items.map((item, index) => ({
        id: index.toString(),
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: calculateItemAmount(item.quantity, item.rate)
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setIsCreateDialogOpen(false);
    resetForm();
    
    toast({
      title: 'Success',
      description: 'Invoice created successfully',
    });
  };

  const resetForm = () => {
    setInvoiceForm({
      customer_id: "",
      due_date: "",
      notes: "",
      terms: "Payment is due within 30 days of invoice date.",
      discount: "",
      items: [{ description: "", quantity: 1, rate: 0 }]
    });
  };

  const generatePDF = (invoice: Invoice) => {
    // Create a simple HTML invoice template for PDF generation
    const invoiceHTML = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info { text-align: right; }
            .invoice-title { font-size: 24px; font-weight: bold; color: #333; }
            .invoice-details { margin: 30px 0; }
            .customer-info { margin: 20px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f5f5f5; }
            .totals { text-align: right; margin-top: 30px; }
            .total-row { margin: 10px 0; }
            .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${settings.businessName || 'Point Art Hub'}</h1>
              <p>${settings.businessAddress || 'Kampala, Uganda'}</p>
              <p>Email: ${settings.businessEmail || 'info@pointarthub.com'}</p>
              <p>Phone: ${settings.businessPhone || '+256700000000'}</p>
            </div>
          </div>
          
          <div class="invoice-title">INVOICE</div>
          
          <div class="invoice-details">
            <div style="display: flex; justify-content: space-between;">
              <div>
                <strong>Invoice Number:</strong> ${invoice.invoice_number}<br>
                <strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}<br>
                <strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}
              </div>
              <div class="customer-info">
                <strong>Bill To:</strong><br>
                ${invoice.customer.full_name}<br>
                ${invoice.customer.company ? invoice.customer.company + '<br>' : ''}
                ${invoice.customer.address || ''}<br>
                ${invoice.customer.email || ''}<br>
                ${invoice.customer.phone || ''}
              </div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatUGX(item.rate)}</td>
                  <td style="text-align: right;">${formatUGX(item.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">Subtotal: ${formatUGX(invoice.subtotal)}</div>
            ${invoice.discount > 0 ? `<div class="total-row">Discount: -${formatUGX(invoice.discount)}</div>` : ''}
            <div class="total-row">Tax (${invoice.tax_rate}%): ${formatUGX(invoice.tax_amount)}</div>
            <div class="total-row final-total">Total: ${formatUGX(invoice.total)}</div>
          </div>
          
          ${invoice.notes ? `
            <div class="footer">
              <strong>Notes:</strong><br>
              ${invoice.notes}
            </div>
          ` : ''}
          
          ${invoice.terms ? `
            <div class="footer">
              <strong>Terms & Conditions:</strong><br>
              ${invoice.terms}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.print();
    }

    toast({
      title: 'PDF Generated',
      description: 'Invoice PDF has been generated. You can print or save it.',
    });
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice['status']) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status, updated_at: new Date().toISOString() }
          : invoice
      )
    );
    
    toast({
      title: 'Status Updated',
      description: `Invoice status changed to ${status}`,
    });
  };

  const deleteInvoice = (invoiceId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can delete invoices',
        variant: 'destructive',
      });
      return;
    }

    if (confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      toast({
        title: 'Invoice Deleted',
        description: 'Invoice has been permanently deleted',
      });
    }
  };

  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer.company && invoice.customer.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'sent': return <Mail className="h-3 w-3" />;
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'overdue': return <AlertCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Calculate statistics
  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total, 0),
    pendingAmount: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Invoice Management
            </h1>
            <p className="text-gray-600 mt-2">Create, manage and track your business invoices</p>
          </div>
          
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Invoices</p>
                  <p className="text-3xl font-bold">{stats.totalInvoices}</p>
                </div>
                <FileText className="h-12 w-12 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold">{formatUGX(stats.totalAmount)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Paid Amount</p>
                  <p className="text-2xl font-bold">{formatUGX(stats.paidAmount)}</p>
                </div>
                <CheckCircle className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending Amount</p>
                  <p className="text-2xl font-bold">{formatUGX(stats.pendingAmount)}</p>
                </div>
                <Clock className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search invoices by number, customer, or company..."
                  className="pl-9 border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices ({filteredInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 border-emerald-600 rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices found matching your criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="hover:bg-emerald-50/50 transition-colors">
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.customer.full_name}</p>
                            {invoice.customer.company && (
                              <p className="text-sm text-gray-500">{invoice.customer.company}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(invoice.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(invoice.status)}
                              {invoice.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatUGX(invoice.total)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsViewDialogOpen(true);
                              }}
                              className="hover:bg-emerald-50"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generatePDF(invoice)}
                              className="hover:bg-blue-50"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteInvoice(invoice.id)}
                                className="hover:bg-red-50 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Invoice Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={invoiceForm.customer_id} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, customer_id: value })}>
                    <SelectTrigger>
                      <User className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.full_name} {customer.company && `(${customer.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold">Invoice Items</Label>
                  <Button type="button" onClick={addInvoiceItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {invoiceForm.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Input
                          id={`description-${index}`}
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`rate-${index}`}>Rate (UGX)</Label>
                        <Input
                          id={`rate-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateInvoiceItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Amount</Label>
                        <div className="p-2 bg-gray-50 rounded border">
                          {formatUGX(calculateItemAmount(item.quantity, item.rate))}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {invoiceForm.items.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeInvoiceItem(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatUGX(calculateSubtotal(invoiceForm.items))}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                    <div>
                      <Label htmlFor="discount">Discount (UGX)</Label>
                      <Input
                        id="discount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  {parseFloat(invoiceForm.discount) > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="text-red-600">-{formatUGX(parseFloat(invoiceForm.discount))}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Tax ({settings.taxRate || 18}%):</span>
                    <span className="font-medium">
                      {formatUGX(((calculateSubtotal(invoiceForm.items) - (parseFloat(invoiceForm.discount) || 0)) * (settings.taxRate || 18)) / 100)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      {formatUGX(
                        calculateSubtotal(invoiceForm.items) - 
                        (parseFloat(invoiceForm.discount) || 0) + 
                        (((calculateSubtotal(invoiceForm.items) - (parseFloat(invoiceForm.discount) || 0)) * (settings.taxRate || 18)) / 100)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                    placeholder="Additional notes for the customer..."
                    className="min-h-[100px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={invoiceForm.terms}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  Create Invoice
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice Details</span>
                {selectedInvoice && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedInvoice.status}
                      onValueChange={(value: Invoice['status']) => updateInvoiceStatus(selectedInvoice.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => selectedInvoice && generatePDF(selectedInvoice)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xl font-bold text-emerald-800 mb-3">Invoice Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Invoice #:</strong> {selectedInvoice.invoice_number}</div>
                        <div><strong>Issue Date:</strong> {new Date(selectedInvoice.issue_date).toLocaleDateString()}</div>
                        <div><strong>Due Date:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2">
                          <strong>Status:</strong> 
                          <Badge className={getStatusColor(selectedInvoice.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(selectedInvoice.status)}
                              {selectedInvoice.status}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-emerald-800 mb-3">Customer Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <strong>{selectedInvoice.customer.full_name}</strong>
                        </div>
                        {selectedInvoice.customer.company && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            {selectedInvoice.customer.company}
                          </div>
                        )}
                        {selectedInvoice.customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {selectedInvoice.customer.email}
                          </div>
                        )}
                        {selectedInvoice.customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {selectedInvoice.customer.phone}
                          </div>
                        )}
                        {selectedInvoice.customer.address && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedInvoice.customer.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">Quantity</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="text-right font-medium">{formatUGX(item.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Invoice Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 max-w-sm ml-auto">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatUGX(selectedInvoice.subtotal)}</span>
                    </div>
                    {selectedInvoice.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-red-600">-{formatUGX(selectedInvoice.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax ({selectedInvoice.tax_rate}%):</span>
                      <span className="font-medium">{formatUGX(selectedInvoice.tax_amount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatUGX(selectedInvoice.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes and Terms */}
                {(selectedInvoice.notes || selectedInvoice.terms) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedInvoice.notes && (
                      <div>
                        <h4 className="font-semibold mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedInvoice.notes}</p>
                      </div>
                    )}
                    {selectedInvoice.terms && (
                      <div>
                        <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedInvoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceManagement;