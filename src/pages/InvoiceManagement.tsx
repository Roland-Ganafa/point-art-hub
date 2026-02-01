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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Download,
  Search,
  X,
  Pencil,
  ChevronDown,
  FileCheck,
  Receipt,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

  const { toast } = useToast();
  const { user, isAdmin } = useUser();

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [documentType, setDocumentType] = useState<'Pro - Forma' | 'Delivery Note' | 'Receipt' | 'Invoice'>('Pro - Forma');

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
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*)
        `)
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
      const { data: invoice, error: invoiceError } = await (supabase as any)
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await (supabase as any)
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

      let invoiceId = editingInvoiceId;
      let invoiceNumber = '';

      if (isEditing && editingInvoiceId) {
        // Update existing invoice
        const totalAmount = calculateTotal();
        const amountInWords = numberToWords(totalAmount);

        const { data: invoice, error: invoiceError } = await (supabase as any)
          .from('invoices')
          .update({
            customer_name: formData.customer_name,
            invoice_date: formData.invoice_date,
            total_amount: totalAmount,
            amount_in_words: amountInWords,
            notes: formData.notes,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingInvoiceId)
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        invoiceNumber = invoice.invoice_number;

        // Delete existing items
        const { error: deleteError } = await (supabase as any)
          .from('invoice_items')
          .delete()
          .eq('invoice_id', editingInvoiceId);

        if (deleteError) throw deleteError;
      } else {
        // Create new invoice
        // Get next invoice and reference numbers
        const { data: nextInv, error: invError } = await (supabase as any).rpc('get_next_invoice_number');
        if (invError) {
          console.error('Error getting invoice number:', invError);
          throw new Error(`Failed to generate invoice number: ${invError.message}`);
        }

        const { data: nextRef, error: refError } = await (supabase as any).rpc('get_next_reference_number');
        if (refError) {
          console.error('Error getting reference number:', refError);
          throw new Error(`Failed to generate reference number: ${refError.message}`);
        }

        const totalAmount = calculateTotal();
        const amountInWords = numberToWords(totalAmount);

        // Create invoice
        const { data: invoice, error: invoiceError } = await (supabase as any)
          .from('invoices')
          .insert({
            invoice_number: nextInv,
            reference_number: nextRef,
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

        if (invoiceError) throw invoiceError;
        invoiceId = invoice.id;
        invoiceNumber = invoice.invoice_number;
      }

      // Create invoice items
      const itemsToInsert = lineItems.map((item, index) => ({
        invoice_id: invoiceId,
        serial_number: index + 1,
        particulars: item.particulars,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: calculateLineAmount(item.quantity, item.rate),
      }));

      const { error: itemsError } = await (supabase as any)
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Invoice items creation error:', itemsError);
        throw new Error(`Failed to save invoice items: ${itemsError.message}`);
      }

      toast({
        title: 'Success',
        description: `Invoice #${invoiceNumber} ${isEditing ? 'updated' : 'created'} successfully`,
      });

      setShowCreateDialog(false);
      resetForm();
      fetchInvoices();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save invoice. Please try again.',
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

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      setIsLoading(true);
      const fullInvoice = await fetchInvoiceWithItems(invoice.id);

      setFormData({
        customer_name: fullInvoice.customer_name,
        invoice_date: fullInvoice.invoice_date,
        notes: fullInvoice.notes || '',
      });

      setLineItems(fullInvoice.items.map(item => ({
        particulars: item.particulars,
        description: item.description || '',
        quantity: item.quantity,
        rate: item.rate,
      })));

      setEditingInvoiceId(fullInvoice.id);
      setIsEditing(true);
      setShowCreateDialog(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load invoice for editing',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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
      const { error } = await (supabase as any)
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });

      setSelectedInvoiceIds(prev => prev.filter(id => id !== invoiceId));
      await fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) return;
    if (selectedInvoiceIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedInvoiceIds.length} selected invoices?`)) return;

    try {
      setIsLoading(true);

      const { error } = await (supabase as any)
        .from('invoices')
        .delete()
        .in('id', selectedInvoiceIds);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedInvoiceIds.length} invoices deleted successfully`,
      });

      setSelectedInvoiceIds([]);
      await fetchInvoices();
    } catch (error: any) {
      console.error('Error in bulk delete:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete selected invoices',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map(inv => inv.id));
    }
  };

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setLineItems([{ particulars: '', description: '', quantity: 1, rate: 0 }]);
    setIsEditing(false);
    setEditingInvoiceId(null);
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                New Document
                <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => {
                resetForm();
                setDocumentType('Invoice');
                setShowCreateDialog(true);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                resetForm();
                setDocumentType('Pro - Forma');
                setShowCreateDialog(true);
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Create Pro - Forma
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                resetForm();
                setDocumentType('Delivery Note');
                setShowCreateDialog(true);
              }}>
                <FileCheck className="h-4 w-4 mr-2" />
                Create Delivery Note
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                resetForm();
                setDocumentType('Receipt');
                setShowCreateDialog(true);
              }}>
                <Receipt className="h-4 w-4 mr-2" />
                Create Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  All Invoices
                </CardTitle>
                <CardDescription>View and manage your invoices</CardDescription>
              </div>
              {isAdmin && selectedInvoiceIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected ({selectedInvoiceIds.length})
                </Button>
              )}
            </div>
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
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                          checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                          onChange={toggleSelectAll}
                        />
                      </TableHead>
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
                    {filteredInvoices.map((invoice, index) => (
                      <TableRow
                        key={invoice.id}
                        className={selectedInvoiceIds.includes(invoice.id) ? "bg-blue-50/50" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                            checked={selectedInvoiceIds.includes(invoice.id)}
                            onChange={() => toggleSelectInvoice(invoice.id)}
                          />
                        </TableCell>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
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
              <DialogTitle>{isEditing ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
              <DialogDescription>
                {isEditing ? 'Update the details of this pro-forma invoice' : 'Fill in the details to create a new pro-forma invoice'}
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
                disabled={isLoading}
              >
                {isEditing ? 'Save Changes' : 'Create Invoice'}
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
                <div className="bg-white relative overflow-hidden min-h-[1000px] font-sans text-black pt-8 pb-12 px-1">
                  {/* Corner Decorations for Pro-Forma */}
                  {documentType === 'Pro - Forma' && (
                    <>
                      {/* Pink Triangle Bottom-Left */}
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-600 z-0" style={{ clipPath: 'polygon(0 0, 0% 100%, 100% 100%)' }}></div>
                      {/* Black Square Bottom-Right */}
                      <div className="absolute bottom-0 right-0 w-16 h-24 bg-black z-0"></div>
                    </>
                  )}

                  {/* Faded Watermark Logo in Background - Only for Pro-Forma */}
                  {documentType === 'Pro - Forma' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08] z-0">
                      <img
                        src="/point-art-logo.svg"
                        alt=""
                        className="w-[600px] h-[600px] rotate-[-15deg]"
                      />
                    </div>
                  )}

                  {/* Top accent bars - Only for Invoice, Pro-Forma has them after header */}
                  {documentType !== 'Pro - Forma' && (
                    <div className="absolute top-0 left-0 right-0">
                      <div className="h-1.5 bg-pink-600 w-full mb-1"></div>
                      <div className="h-1 bg-black w-full"></div>
                    </div>
                  )}

                  <div className="border-2 border-black p-0 relative z-10 m-4 bg-white">
                    {/* Header with Logo and Contact */}
                    <div className="flex justify-between items-start p-4 pb-1">
                      <div className="flex items-start gap-3">
                        <img
                          src="/point-art-logo.svg"
                          alt="Point Art Solutions Logo"
                          className="h-24 w-24"
                        />
                        <div className="flex flex-col mt-2">
                          <div className="flex items-baseline gap-1">
                            <span className="text-[42px] font-black leading-none tracking-tight">POINT</span>
                            <span className="text-[42px] font-black leading-none tracking-tight text-pink-600">ART</span>
                          </div>
                          <div className="bg-pink-600 text-white px-2 py-0.5 text-lg font-black mt-1 inline-block text-center tracking-widest leading-none">
                            SOLUTIONS
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-1 pr-2 pt-2">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[14px] font-bold text-gray-700">P.O BOX 25434 Kampala (U)</span>
                          <div className="bg-pink-600 rounded-full p-1 flex items-center justify-center w-6 h-6">
                            <MapPin className="text-white h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-pink-600">
                          <span className="text-[14px] font-bold text-gray-700">0704 528 246 / 0779 031 577</span>
                          <div className="bg-red-600 rounded-full p-1 flex items-center justify-center w-6 h-6">
                            <Phone className="text-white h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-green-600 font-bold">
                          <span className="text-[14px] font-bold text-gray-700">0774 528 246 / 0752 871 062</span>
                          <div className="bg-green-600 rounded-full p-1 flex items-center justify-center w-6 h-6">
                            <MessageCircle className="text-white h-3.5 w-3.5 shadow-sm" />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-blue-800">
                          <span className="text-[14px] font-bold text-gray-700 lowercase">pointartsolutions@yahoo.com</span>
                          <div className="bg-blue-700 rounded-full p-1 flex items-center justify-center w-6 h-6">
                            <Mail className="text-white h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services Line with colored bars */}
                    <div className="px-0">
                      {documentType === 'Pro - Forma' ? (
                        <>
                          <div className="bg-black text-white py-1 px-2 text-[11px] font-black tracking-tighter text-center flex items-center justify-center gap-1">
                            FOR: | PRINTING | DESIGNING | BRANDING | SIGNS | EMBROIDERY | ENGRAVING | GENERAL SUPPLIES ETC...
                          </div>
                          <div className="h-[2px] bg-pink-600 w-full mb-0.5"></div>
                          <div className="h-[1px] bg-black w-full mb-2"></div>
                        </>
                      ) : (
                        <>
                          <div className="h-1.5 bg-pink-600 w-full"></div>
                          <div className="h-[1px] bg-black w-full"></div>
                          <div className="py-1 text-center font-bold text-[10px] tracking-tight text-black">
                            Experts in: Printing, Designing, Branding, Signs, Embroidery, Engraving & General Supply
                          </div>
                          <div className="h-[1px] bg-black w-full mb-4"></div>
                        </>
                      )}
                    </div>

                    {/* Pro-forma ID Info */}
                    {documentType === 'Pro - Forma' && (
                      <div className="flex justify-between items-baseline px-8 mb-2">
                        <div className="font-bold text-xl">101028852</div>
                        <div className="font-black text-[30px] uppercase">PRO-FORMA</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-black text-3xl">No.</span>
                          <span className="text-red-500 font-bold text-2xl">{selectedInvoice.invoice_number}</span>
                        </div>
                      </div>
                    )}

                    {/* Reference, Pro-forma, Invoice Number */}
                    {/* Boxy layout for M/S and Date/No */}
                    <div className="px-4 pb-4">
                      {documentType === 'Pro - Forma' ? (
                        <div className="flex items-end h-8 px-4 mb-2 relative">
                          <div className="flex-1 flex items-end">
                            <span className="font-bold text-lg mr-1 leading-none whitespace-nowrap">M/S:</span>
                            <div className="flex-1 border-b border-dotted border-black h-0 mb-1 mx-1 relative">
                              <span className="absolute bottom-1.5 left-2 font-bold text-lg">{selectedInvoice.customer_name}</span>
                            </div>
                            <span className="font-bold text-lg ml-2 mr-1 leading-none whitespace-nowrap">Date:</span>
                            <div className="w-56 border-b border-dotted border-black h-0 mb-1 mx-1 relative">
                              <span className="absolute bottom-1.5 left-2 font-bold text-lg">{format(new Date(selectedInvoice.invoice_date), 'dd/MM/yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4 h-32">
                          {/* Left box: M/S */}
                          <div className="flex-1 border-2 border-black p-4 relative rounded-md">
                            <div className="flex items-end">
                              <span className="font-bold text-xl mr-2">M/S:</span>
                              <div className="flex-1 border-b border-dotted border-black h-0 mb-1"></div>
                              <span className="absolute left-16 top-4 font-bold text-lg">{selectedInvoice.customer_name}</span>
                            </div>
                            <div className="border-b border-dotted border-black h-0 mt-8 w-full"></div>
                          </div>

                          {/* Right box: Invoice Details */}
                          <div className="w-[300px] border-2 border-black flex flex-col rounded-md overflow-hidden">
                            <div className="bg-pink-600 text-white text-center py-1 font-black text-2xl tracking-[0.1em] border-b-2 border-black">
                              {documentType.toUpperCase()}
                            </div>
                            <div className="flex flex-1">
                              <div className="w-1/3 border-r-2 border-black flex items-center justify-center font-bold text-lg">No.</div>
                              <div className="flex-1 flex items-center justify-start px-4 font-bold text-red-600 text-xl tracking-tight">
                                {selectedInvoice.invoice_number}
                              </div>
                            </div>
                            <div className="flex flex-1 border-t-2 border-black">
                              <div className="w-1/3 border-r-2 border-black flex items-center justify-center font-bold text-lg">Date:</div>
                              <div className="flex-1 flex items-center justify-start px-4 font-bold text-lg">
                                {format(new Date(selectedInvoice.invoice_date), 'dd/MM/yyyy')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items Table: Dynamic Columns */}
                    <div className="border-t-2 border-black px-4">
                      <table className="w-full border-collapse border-2 border-black">
                        <thead>
                          {documentType === 'Pro - Forma' ? (
                            <tr className="border-b-2 border-black bg-white uppercase text-xs">
                              <th className="border-r-2 border-black p-1 font-black text-center w-36">PARTICULARS</th>
                              <th className="border-r-2 border-black p-1 font-black text-center">DESCRIPTION</th>
                              <th className="border-r-2 border-black p-1 font-black text-center w-16">QTY</th>
                              <th className="border-r-2 border-black p-1 font-black text-center w-24">RATE</th>
                              <th className="p-1 font-black text-center w-36">AMT(UGX)</th>
                            </tr>
                          ) : (
                            <tr className="border-b-2 border-black bg-white">
                              <th className="border-r-2 border-black p-2 text-base font-black text-center">PARTICULARS</th>
                              <th className="border-r-2 border-black p-2 text-base font-black text-center w-24">QTY</th>
                              <th className="border-r-2 border-black p-2 text-base font-black text-center w-40">RATE</th>
                              <th className="p-2 text-base font-black text-center w-40">AMOUNT</th>
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {selectedInvoice.items.map((item, index) => (
                            <tr key={item.id} className="h-10">
                              {documentType === 'Pro - Forma' ? (
                                <>
                                  <td className="border-r-2 border-black p-2 text-sm font-bold uppercase">{item.particulars}</td>
                                  <td className="border-r-2 border-black p-2 text-[10px] italic">{item.description || "-"}</td>
                                  <td className="border-r-2 border-black p-2 text-base font-bold text-center">{item.quantity}</td>
                                  <td className="border-r-2 border-black p-2 text-base font-bold text-center">{item.rate.toLocaleString()}</td>
                                  <td className="p-2 text-base font-black text-right pr-4">{item.amount.toLocaleString()}</td>
                                </>
                              ) : (
                                <>
                                  <td className="border-r-2 border-black p-2 text-sm font-bold uppercase overflow-hidden whitespace-nowrap overflow-ellipsis">
                                    {item.particulars} {item.description && <span className="text-[10px] text-gray-500 italic lowercase block leading-none">{item.description}</span>}
                                  </td>
                                  <td className="border-r-2 border-black p-2 text-base font-bold text-center">{item.quantity}</td>
                                  <td className="border-r-2 border-black p-2 text-base font-bold text-center">{item.rate.toLocaleString()}</td>
                                  <td className="p-2 text-base font-black text-right pr-4">{item.amount.toLocaleString()}</td>
                                </>
                              )}
                            </tr>
                          ))}
                          {/* Empty rows to fill space */}
                          {[...Array(Math.max(1, (documentType === 'Pro - Forma' ? 12 : 15) - selectedInvoice.items.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className="h-10">
                              {documentType === 'Pro - Forma' ? (
                                <>
                                  <td className="border-r-2 border-black"></td>
                                  <td className="border-r-2 border-black"></td>
                                  <td className="border-r-2 border-black"></td>
                                  <td className="border-r-2 border-black"></td>
                                  <td className="border-r-2 border-black"></td>
                                  <td></td>
                                </>
                              ) : (
                                <>
                                  <td className="border-r-2 border-black"></td>
                                  <td className="border-r-2 border-black"></td>
                                  <td className="border-r-2 border-black"></td>
                                  <td></td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-black h-12">
                            <td colSpan={documentType === 'Pro - Forma' ? 3 : 2} className="border-r-2 border-black p-2 px-4 relative">
                              <div className="flex items-center justify-start gap-4">
                                <span className="font-black italic text-xl">E&O.E</span>
                                <span className="text-[14px] font-bold italic whitespace-nowrap leading-none">Services once rendered are not renegotiable - Thanks</span>
                              </div>
                            </td>
                            <td className="border-r-2 border-black p-2 text-center align-middle bg-white">
                              <span className="font-black text-2xl uppercase">TOTAL</span>
                            </td>
                            <td className="p-2 text-right pr-4 align-middle bg-white border-2 border-black border-y-0 border-r-0">
                              <span className="font-black text-2xl">{selectedInvoice.total_amount.toLocaleString()}</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Amount in Words */}
                    <div className="px-6 py-2 pt-4">
                      {documentType === 'Pro - Forma' ? (
                        <div className="flex items-end mb-4">
                          <span className="font-black italic text-base whitespace-nowrap">Amount in words:</span>
                          <div className="flex-1 border-b border-dotted border-black ml-2 mb-1.5 h-0"></div>
                          <span className="absolute ml-40 font-bold italic text-lg leading-none">{selectedInvoice?.amount_in_words}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-end mb-4">
                            <span className="font-bold whitespace-nowrap text-xl">Amount in words:</span>
                            <div className="flex-1 border-b border-dotted border-black ml-2 mb-1.5 h-0"></div>
                            <span className="absolute ml-48 font-bold italic text-lg leading-none">{selectedInvoice?.amount_in_words}</span>
                          </div>
                          <div className="border-b border-dotted border-black w-full h-0 mb-6"></div>
                        </>
                      )}
                    </div>

                    {/* Payment Details Section - Only for Invoice */}
                    {documentType === 'Invoice' && (
                      <div className="mt-2 border-2 border-black overflow-hidden mx-4 rounded-sm">
                        <div className="bg-black text-white text-center py-1 font-black text-sm tracking-[0.25em] uppercase">
                          Payment Transaction Details
                        </div>
                        <div className="p-2 text-center text-[10px] font-black bg-white leading-relaxed">
                          ACCOUNT NAME: <span className="font-bold">Point Art Solutions</span>,
                          ACC No.: <span className="font-bold">3200655447</span>,
                          BANK: <span className="font-bold">Centenary</span>,
                          BRANCH: <span className="font-bold border-b border-black">Rubaga</span>
                        </div>
                      </div>
                    )}

                    {/* Signature and Tagline Footer */}
                    <div className="flex flex-col items-center px-6 pt-4 pb-2 relative z-10">
                      {documentType === 'Pro - Forma' ? (
                        <>
                          <div className="w-full flex justify-end mb-2">
                            <div className="flex items-end gap-2 text-[14px] font-black italic">
                              <span>Sign on behalf of Point Art Solutions:................................................</span>
                            </div>
                          </div>
                          <div className="h-[2px] bg-pink-600 w-full mb-0.5"></div>
                          <div className="h-[1px] bg-black w-full mb-1"></div>
                          <div className="text-[12px] font-bold italic text-black uppercase tracking-tight">
                            “Expertise You Can Trust”
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full flex justify-end mb-4">
                            <div className="flex items-end gap-2 text-[13px] font-bold italic">
                              <span>Sign for: Point Art Solutions:</span>
                              <div className="border-b border-dotted border-black w-72 mb-1"></div>
                            </div>
                          </div>
                          <div className="h-[2px] bg-pink-600 w-full mb-1"></div>
                          <div className="text-sm font-bold italic text-black font-serif">
                            “Expertise You Can Trust”
                          </div>
                        </>
                      )}
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