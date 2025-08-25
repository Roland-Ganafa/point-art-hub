import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";

interface GiftDailySale {
  id: string;
  date: string; // ISO date
  item: string;
  code: string | null;
  quantity: number;
  unit: string;
  bpx: number;
  spx: number;
  created_at?: string;
  updated_at?: string;
}

const formatUGX = (n: number | null | undefined) => {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n);
};

const startEndOfMonth = (yyyymm: string) => {
  const [y, m] = yyyymm.split("-").map(Number);
  const start = new Date(y, (m ?? 1) - 1, 1);
  const end = new Date(y, (m ?? 1), 1); // first day of next month
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISO(start), end: toISO(end) };
};

const GiftsDailySales = () => {
  const { toast } = useToast();
  const { profile } = useUser();
  const [items, setItems] = useState<GiftDailySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [salesProfiles, setSalesProfiles] = useState<Array<{id: string, sales_initials: string, full_name: string}>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    item: "",           // We'll use this for both category and item
    itemName: "",       // This is for UI only and won't be sent to database
    code: "",
    quantity: "1",
    unit: "Pc",
    bpx: "",
    spx: "",
    soldBy: ""          // UI only field
  });

  // Add calculated profit state
  const [calculatedProfit, setCalculatedProfit] = useState<number>(0);

  // Calculate profit whenever buying or selling price changes
  useEffect(() => {
    const bpx = parseFloat(formData.bpx) || 0;
    const spx = parseFloat(formData.spx) || 0;
    const quantity = parseInt(formData.quantity) || 1;
    const profit = (spx - bpx) * quantity;
    setCalculatedProfit(profit);
  }, [formData.bpx, formData.spx, formData.quantity]);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    try {
      // First fetch the sales data
      const { data, error } = await supabase
        .from("gift_daily_sales")
        .select("*")
        .gte("date", startOfDay)
        .lte("date", endOfDay)
        .order("date", { ascending: false });

      if (error) {
        toast({ title: "Error fetching daily sales", description: error.message, variant: "destructive" });
      } else {
        console.log("Fetched gift daily sales data:", data);
        setItems(data as GiftDailySale[] || []);
      }
      
      // Also refresh sales profiles
      await fetchSalesProfiles();
    } catch (error) {
      console.error("Error in fetchData:", error);
      toast({ title: "Error fetching daily sales", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, sales_initials, full_name")
        .not("sales_initials", "is", null);
        
      if (error) throw error;
      setSalesProfiles(data || []);
      
      // If no profiles with initials found, check all profiles
      if (!data || data.length === 0) {
        const { data: allProfiles, error: allError } = await supabase
          .from("profiles")
          .select("id, sales_initials, full_name");
        if (allError) console.error("Error fetching all profiles:", allError);
      }
    } catch (error) {
      console.error("Error fetching sales profiles:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSalesProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, GiftDailySale[]> = {};
    for (const r of items) {
      (map[r.date] ||= []).push(r);
    }
    return map;
  }, [items]);

  const totals = useMemo(() => {
    return items.reduce(
      (acc, r) => {
        acc.bpx += Number(r.bpx || 0) * Number(r.quantity || 0) / Number(r.quantity || 1); // per-row value already bpx
        acc.spx += Number(r.spx || 0);
        return acc;
      },
      { bpx: 0, spx: 0 }
    );
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.item.trim()) {
      toast({ title: "Validation Error", description: "Category is required", variant: "destructive" });
      return;
    }
    
    if (!formData.itemName.trim()) {
      toast({ title: "Validation Error", description: "Item name is required", variant: "destructive" });
      return;
    }
    
    const quantity = parseInt(formData.quantity) || 0;
    const bpx = parseFloat(formData.bpx) || 0;
    const spx = parseFloat(formData.spx) || 0;
    
    if (quantity <= 0) {
      toast({ title: "Validation Error", description: "Quantity must be a positive number", variant: "destructive" });
      return;
    }
    
    if (bpx < 0) {
      toast({ title: "Validation Error", description: "Buying price cannot be negative", variant: "destructive" });
      return;
    }
    
    if (spx < 0) {
      toast({ title: "Validation Error", description: "Selling price cannot be negative", variant: "destructive" });
      return;
    }
    
    // Combine category and item name into a single item field for database
    // Format: "Category: Item Name"
    const combinedItem = `${formData.item.trim()}: ${formData.itemName.trim()}`;
    
    // Create a minimal payload with only fields that definitely exist in the database
    const payload = {
      date: formData.date,
      item: combinedItem,  // Store both category and item in a single field
      code: formData.code ? formData.code.trim() : null,
      quantity: quantity,
      unit: formData.unit,
      bpx: bpx,
      spx: spx
    };
    
    // Log the payload for debugging
    console.log("Submitting gift sale payload:", payload);
    
    try {
      let data, error;
      
      if (editingId) {
        // Update existing sale
        const result = await supabase
          .from("gift_daily_sales")
          .update(payload)
          .eq("id", editingId)
          .select();
        data = result.data;
        error = result.error;
      } else {
        // Create new sale
        const result = await supabase
          .from("gift_daily_sales")
          .insert([payload])
          .select();
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error("Database error details:", error);
        console.error("Payload sent:", payload);
        
        // Provide more specific error messages
        if (error.code === '42703') {
          toast({ 
            title: "Database Error", 
            description: "Column doesn't exist: " + error.message, 
            variant: "destructive" 
          });
        } else if (error.code === '23502') {
          toast({ 
            title: "Database Error", 
            description: "Missing required data: " + error.message, 
            variant: "destructive" 
          });
        } else if (error.code === '23503') {
          toast({ 
            title: "Database Error", 
            description: "Foreign key violation: " + error.message, 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Error saving entry", 
            description: error.message || "Unknown database error", 
            variant: "destructive" 
          });
        }
      } else {
        console.log("Successfully saved data:", data);
        toast({ 
          title: "Success", 
          description: editingId ? "Daily sale updated successfully" : "Daily sale added successfully" 
        });
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          item: "",
          itemName: "",
          code: "",
          quantity: "1",
          unit: "Pc",
          bpx: "",
          spx: "",
          soldBy: ""
        });
        fetchData();
      }
    } catch (error) {
      console.error("Exception while saving gift sale:", error);
      toast({ 
        title: "Unexpected Error", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    }
  };
  
  const handleEdit = (sale: GiftDailySale) => {
    // Try to split the item field into category and item name
    // Format expected: "Category: Item Name"
    let category = "";
    let itemName = "";
    
    if (sale.item) {
      const colonIndex = sale.item.indexOf(":");
      if (colonIndex > 0) {
        category = sale.item.substring(0, colonIndex).trim();
        itemName = sale.item.substring(colonIndex + 1).trim();
      } else {
        // If no colon found, just use the whole string as category
        category = sale.item;
      }
    }
    
    setFormData({
      date: new Date(sale.date).toISOString().slice(0, 10),
      item: category,
      itemName: itemName,
      code: sale.code || "",
      quantity: sale.quantity.toString(),
      unit: sale.unit,
      bpx: sale.bpx.toString(),
      spx: sale.spx.toString(),
      soldBy: ""
    });
    setEditingId(sale.id);
    setIsDialogOpen(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    const { error } = await supabase.from("gift_daily_sales").delete().eq("id", saleId);

    if (error) {
      toast({
        title: "Error deleting sale",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Sale deleted successfully",
      });
      fetchData();
    }
  };

  const exportCSV = () => {
    if (!items.length) return;
    const headers = ["date","item","code","quantity","unit","bpx","spx"];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = items.map(r => headers.map(h => escape((r as any)[h])).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    a.download = `gifts-daily-sales-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate totals for display
  const totalSales = items.reduce((sum, sale) => sum + Number(sale.spx || 0), 0);
  const totalProfit = items.reduce((sum, sale) => sum + ((Number(sale.spx || 0) - Number(sale.bpx || 0)) * Number(sale.quantity || 1)), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Today's Sales</h4>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({
              date: new Date().toISOString().slice(0, 10),
              item: "",
              itemName: "",
              code: "",
              quantity: "1",
              unit: "Pc",
              bpx: "",
              spx: "",
              soldBy: ""
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Gift Sale" : "Record New Gift Sale"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="Category name" 
                  value={formData.item} 
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })} 
                  required
                />
              </div>
              <div>
                <Label htmlFor="itemName">Item</Label>
                <Input 
                  id="itemName" 
                  placeholder="Item name" 
                  value={formData.itemName} 
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} 
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Code / Description</Label>
                <Input 
                  id="code" 
                  placeholder="Code or description" 
                  value={formData.code} 
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1"
                    value={formData.quantity} 
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pc">Pc</SelectItem>
                      <SelectItem value="Pcs">Pcs</SelectItem>
                      <SelectItem value="Set">Set</SelectItem>
                      <SelectItem value="Dozen">Dozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bpx">Buying Price (UGX)</Label>
                  <Input 
                    id="bpx" 
                    type="number" 
                    step="0.01" 
                    placeholder="0" 
                    value={formData.bpx} 
                    onChange={(e) => setFormData({ ...formData, bpx: e.target.value })} 
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="spx">Selling Price (UGX)</Label>
                  <Input 
                    id="spx" 
                    type="number" 
                    step="0.01" 
                    placeholder="0" 
                    value={formData.spx} 
                    onChange={(e) => setFormData({ ...formData, spx: e.target.value })} 
                    required
                  />
                </div>
              </div>
              
              {/* Display calculated profit */}
              <div>
                <Label>Profit (UGX)</Label>
                <div className="p-2 border rounded-md bg-muted/30">
                  <p className={`text-lg font-semibold ${calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    UGX {calculatedProfit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label>Sold By</Label>
                <Select
                  value={formData.soldBy}
                  onValueChange={(value) => setFormData({ ...formData, soldBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        profile?.sales_initials 
                          ? `${profile.sales_initials} (You)` 
                          : salesProfiles.length > 0 
                            ? "Select sales person" 
                            : "No sales persons available"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {profile?.sales_initials && (
                      <SelectItem value={profile.id}>
                        {profile.sales_initials} - {profile.full_name} (You)
                      </SelectItem>
                    )}
                    {salesProfiles.length > 0 ? (
                      salesProfiles
                        .filter(p => p.id !== profile?.id)
                        .map(person => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.sales_initials} - {person.full_name}
                          </SelectItem>
                        ))
                    ) : (
                      !profile?.sales_initials && (
                        <SelectItem value="no_sales_persons" disabled>
                          No sales persons with initials found
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {salesProfiles.length === 0 && !profile?.sales_initials && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No users have sales initials assigned. Visit Admin Profile to assign initials.
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Record Sale
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {totalProfit.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Code / Description</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>BPX (UGX)</TableHead>
                <TableHead>SPX (UGX)</TableHead>
                <TableHead>Profit (UGX)</TableHead>
                <TableHead>Sold By</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.item && sale.item.includes(":") 
                        ? sale.item.split(":")[0].trim() 
                        : sale.item}
                    </TableCell>
                    <TableCell>
                      {sale.item && sale.item.includes(":") 
                        ? sale.item.split(":")[1].trim() 
                        : "-"}
                    </TableCell>
                    <TableCell>{sale.code || "-"}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.unit}</TableCell>
                    <TableCell>UGX {formatUGX(sale.bpx)}</TableCell>
                    <TableCell>UGX {formatUGX(sale.spx)}</TableCell>
                    <TableCell className="font-semibold text-green-600">UGX {formatUGX((sale.spx - sale.bpx) * sale.quantity)}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">N/A</span>
                    </TableCell>
                    <TableCell>{format(new Date(sale.date), "hh:mm a")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline" 
                          size="sm"
                          disabled
                          className="opacity-50 cursor-not-allowed"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    {loading ? "Loading..." : "No sales recorded today"}
                  </TableCell>
                </TableRow>
              )}

            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftsDailySales;
