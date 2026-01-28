import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Download,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import CustomLoader from '@/components/ui/CustomLoader';
import { Invoice, InvoiceItem, InvoiceWithItems } from '@/types/invoice';
import { numberToWords, calculateLineAmount, calculateInvoiceTotal } from '@/utils/invoiceUtils';
import { format } from 'date-fns';

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithItems | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();
  const { user, isAdmin } = useUser();

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const [lineItems, setLineItems] = useState<Array<{
    particulars: string;
    description: string;
    quantity: number;
    rate: number;
  }>>([
    { particulars: '', description: '', quantity: 1, rate: 0 }
  ]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoiceWithItems = async (invoiceId: string) => {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('serial_number');

      if (itemsError) throw itemsError;

      return { ...invoice, items: items || [] } as InvoiceWithItems;
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { particulars: '', description: '', quantity: 1, rate: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const calculateTotal = () => {
    return calculateInvoiceTotal(lineItems);
  };

  const handleCreateInvoice = async () => {
    // Prevent duplicate submissions
    if (isLoading) return;

    try {
      if (!formData.customer_name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Customer name is required',
          variant: 'destructive',
        });
        return;
      }

      if (lineItems.length === 0 || !lineItems[0].particulars.trim()) {
        toast({
          title: 'Validation Error',
          description: 'At least one line item is required',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      // Get next invoice and reference numbers
      const { data: nextInvoiceNum, error: invoiceNumError } = await supabase.rpc('get_next_invoice_number');
      if (invoiceNumError) {
        console.error('Error getting invoice number:', invoiceNumError);
        throw new Error(`Failed to generate invoice number: ${invoiceNumError.message}`);
      }

      const { data: nextRefNum, error: refNumError } = await supabase.rpc('get_next_reference_number');
      if (refNumError) {
        console.error('Error getting reference number:', refNumError);
        throw new Error(`Failed to generate reference number: ${refNumError.message}`);
      }

      const totalAmount = calculateTotal();
      const amountInWords = numberToWords(totalAmount);

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: nextInvoiceNum,
          reference_number: nextRefNum,
          customer_name: formData.customer_name,
          invoice_date: formData.invoice_date,
          total_amount: totalAmount,
          amount_in_words: amountInWords,
          status: 'draft',
          notes: formData.notes,
          created_by: user?.id,
          updated_by: user?.id,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error('Invoice creation error:', invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message || invoiceError.code}`);
      }

      // Create invoice items
      const itemsToInsert = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        serial_number: index + 1,
        particulars: item.particulars,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: calculateLineAmount(item.quantity, item.rate),
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Invoice items creation error:', itemsError);
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }

      toast({
        title: 'Success',
        description: `Invoice #${invoice.invoice_number} created successfully`,
      });

      setShowCreateDialog(false);
      resetForm();
      fetchInvoices();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      const fullInvoice = await fetchInvoiceWithItems(invoice.id);
      setSelectedInvoice(fullInvoice);
      setShowViewDialog(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can delete invoices',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });

      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setLineItems([{ particulars: '', description: '', quantity: 1, rate: 0 }]);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status.toUpperCase()}</Badge>;
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoice_number.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Invoice Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage pro-forma invoices</p>
          </div>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by customer name or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Invoices
            </CardTitle>
            <CardDescription>View and manage your invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <CustomLoader size="lg" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No invoices found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Reference #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.reference_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>UGX {invoice.total_amount.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
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
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new pro-forma invoice
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Line Items *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {lineItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-3">
                        <Label className="text-xs">Particulars</Label>
                        <Input
                          value={item.particulars}
                          onChange={(e) => handleLineItemChange(index, 'particulars', e.target.value)}
                          placeholder="Item name"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                          placeholder="Optional details"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Rate (UGX)</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleLineItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2 flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Amount</Label>
                          <Input
                            value={calculateLineAmount(item.quantity, item.rate).toFixed(2)}
                            readOnly
                            className="mt-1 bg-gray-50"
                          />
                        </div>
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLineItem(index)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>UGX {calculateTotal().toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 text-right">
                    {numberToWords(calculateTotal())}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes for this invoice"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateInvoice}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                Create Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Invoice Dialog - Point Art Solutions Template */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedInvoice && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Invoice #{selectedInvoice.invoice_number}</span>
                    {getStatusBadge(selectedInvoice.status)}
                  </DialogTitle>
                </DialogHeader>

                {/* Invoice Preview - Official Point Art Branded Template */}
                <div className="bg-white relative overflow-hidden">
                  {/* Pink triangular accent on left edge */}
                  <div className="absolute left-0 top-0 bottom-0 w-8">
                    <div className="absolute left-0 bottom-0 w-0 h-0 border-l-[32px] border-l-pink-600 border-b-[100px] border-b-transparent"></div>
                  </div>

                  <div className="border-2 border-black p-0">
                    {/* Header with Logo and Contact */}
                    <div className="flex justify-between items-start p-4 pb-0">
                      <div className="flex items-start gap-2">
                        <img
                          src="/point-art-logo.svg"
                          alt="Point Art Solutions Logo"
                          className="h-20 w-20"
                        />
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[32px] font-bold leading-none">POINT</span>
                            <span className="text-[32px] font-bold leading-none text-pink-600">ART</span>
                          </div>
                          <div className="bg-pink-600 text-white px-2 py-0.5 text-sm font-bold mt-0.5">
                            SOLUTIONS
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs leading-relaxed">
                        <p className="flex items-center justify-end gap-1">
                          <span className="text-pink-600">📍</span> PO. BOX 25434 Kampala (U)
                        </p>
                        <p className="flex items-center justify-end gap-1">
                          <span className="text-pink-600">📞</span> 0704 528 246 / 0779 031 577
                        </p>
                        <p className="flex items-center justify-end gap-1">
                          <span className="text-pink-600">📱</span> 0774 528 246 / 0704 528 246
                        </p>
                        <p className="flex items-center justify-end gap-1">
                          <span className="text-pink-600">💬</span> WhatsApp: 0759 919 826
                        </p>
                        <p className="flex items-center justify-end gap-1">
                          <span className="text-pink-600">✉️</span> pointartsolutions@yahoo.com
                        </p>
                      </div>
                    </div>

                    {/* Black bar with services */}
                    <div className="bg-black text-white text-[10px] font-bold py-1 px-4 mt-2">
                      <span className="bg-white text-black px-1">For.</span> PRINTING | DESIGNING | BRANDING | SIGNS | EMBROIDERY | ENGRAVING | GENERAL SUPPLIES Etc...
                    </div>

                    {/* Reference, Pro-forma, Invoice Number */}
                    <div className="flex justify-between items-center px-4 py-3 border-t-2 border-b-2 border-black mt-0">
                      <span className="text-sm font-medium">{selectedInvoice.reference_number}</span>
                      <h3 className="text-2xl font-black">PRO-FORMA</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium">No.</span>
                        <span className="text-pink-600 font-bold text-lg">{selectedInvoice.invoice_number}</span>
                      </div>
                    </div>

                    {/* Customer and Date */}
                    <div className="px-4 py-2 text-sm">
                      <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                        <div>
                          <span className="font-bold">M/S:</span>
                          <span className="ml-1">{selectedInvoice.customer_name}</span>
                        </div>
                        <div>
                          <span className="font-bold">Date:</span>
                          <span className="ml-1">{format(new Date(selectedInvoice.invoice_date), 'dd/MM/yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-y-2 border-black bg-white">
                          <th className="border-r border-black p-2 text-xs font-bold text-left w-12">S/N</th>
                          <th className="border-r border-black p-2 text-xs font-bold text-left">PARTICULARS</th>
                          <th className="border-r border-black p-2 text-xs font-bold text-left">DESCRIPTION</th>
                          <th className="border-r border-black p-2 text-xs font-bold text-center w-16">QTY</th>
                          <th className="border-r border-black p-2 text-xs font-bold text-right w-24">RATE</th>
                          <th className="p-2 text-xs font-bold text-right w-28">AMT(UGX)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={item.id} className={index < selectedInvoice.items.length - 1 ? 'border-b border-gray-300' : ''}>
                            <td className="border-r border-black p-2 text-xs text-center">{item.serial_number}</td>
                            <td className="border-r border-black p-2 text-xs">{item.particulars}</td>
                            <td className="border-r border-black p-2 text-xs">{item.description || '-'}</td>
                            <td className="border-r border-black p-2 text-xs text-center">{item.quantity}</td>
                            <td className="border-r border-black p-2 text-xs text-right">{item.rate.toLocaleString()}</td>
                            <td className="p-2 text-xs text-right font-semibold">{item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        {/* Empty rows to fill space if needed */}
                        {[...Array(Math.max(0, 10 - selectedInvoice.items.length))].map((_, i) => (
                          <tr key={`empty-${i}`} className="h-12">
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                          </tr>
                        ))}
                        {/* E&O.E and Total Row */}
                        <tr className="border-t-2 border-black">
                          <td colSpan={5} className="border-r border-black p-2 align-top">
                            <div className="text-[10px] italic">
                              <span className="font-bold">E&O.E</span> Services once rendered are not renegotiable - Thanks
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm">TOTAL</span>
                              <span className="font-bold text-base">{selectedInvoice.total_amount.toLocaleString()}</span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Amount in Words */}
                    <div className="px-4 py-2 border-t border-black">
                      <div className="text-xs border-b border-dotted border-gray-400 pb-1">
                        <span className="font-bold">Amount in words:</span>
                        <span className="ml-1">{selectedInvoice.amount_in_words}</span>
                      </div>
                    </div>

                    {/* Signature Line */}
                    <div className="px-4 py-3 text-xs italic">
                      <div className="border-b border-dotted border-gray-400 pb-1">
                        Sign on behalf of Point Art Solutions: .....................................
                      </div>
                    </div>

                    {/* Bottom pink stripe with tagline */}
                    <div className="bg-pink-600 text-white text-center py-1 text-xs font-semibold border-t-2 border-black">
                      "Expertise You Can Trust"
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                      Close
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default InvoiceManagement;