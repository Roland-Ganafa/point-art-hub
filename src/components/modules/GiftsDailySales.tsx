import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, TrendingUp, ShoppingCart, Gift, Star, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { useOffline } from "@/hooks/useOffline";
import { useOfflineGiftSales } from "@/hooks/useOfflineGiftSales";

interface GiftDailySale {
  id: string;
  date: string; // ISO date
  item: string;
  code: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  bpx: number;
  spx: number;
  sold_by: string | null;
  created_at?: string;
  updated_at?: string;
}

// Define interface for offline gift sales
interface OfflineGiftSale {
  id: string;
  date: string;
  item: string;
  code: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  bpx: number;
  spx: number;
  sold_by: string | null;
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
  const [salesProfiles, setSalesProfiles] = useState<Array<{ id: string, sales_initials: string, full_name: string }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    item: "",
    code: "",
    quantity: "1",
    unit: "Pc",
    bpx: "",
    spx: "",
    soldBy: ""          // UI only field
  });

  // Add offline functionality
  const { isOffline } = useOffline();
  const {
    offlineGiftSales,
    recordOfflineGiftSale,
    syncOfflineGiftSales,
    isSyncing
  } = useOfflineGiftSales();

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
    try {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

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
        setItems(data as any || []);
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
      setSalesProfiles(data as any || []);

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
  }, []);

  // Sync offline sales when coming back online
  useEffect(() => {
    if (!isOffline && offlineGiftSales.length > 0) {
      syncOfflineGiftSales();
    }
  }, [isOffline]);

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
    if (!formData.category.trim()) {
      toast({ title: "Validation Error", description: "Category is required", variant: "destructive" });
      return;
    }

    if (!formData.item.trim()) {
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
    const combinedItem = `${formData.category.trim()}: ${formData.item.trim()}`;

    const payload: any = {
      date: formData.date,
      item: combinedItem,
      quantity: quantity,
      unit: formData.unit,
      bpx: bpx,
      spx: spx,
      code: formData.code ? formData.code.trim() : null,
      description: formData.code ? formData.code.trim() : null,
      sold_by: formData.soldBy === "not_specified" ? null : formData.soldBy
    };

    try {
      // If offline, store sale locally
      if (isOffline) {
        const offlineSale: any = {
          date: formData.date,
          item: combinedItem,
          code: formData.code ? formData.code.trim() : null,
          quantity: quantity,
          unit: formData.unit,
          bpx: bpx,
          spx: spx,
          sold_by: formData.soldBy === "not_specified" ? null : formData.soldBy
        };

        recordOfflineGiftSale(offlineSale);

        toast({
          title: "Offline Mode",
          description: "Sale recorded locally. Will sync when online.",
          variant: "default",
        });

        // Reset form
        setFormData({
          date: new Date().toISOString().slice(0, 10),
          category: "",
          item: "",
          code: "",
          quantity: "1",
          unit: "Pc",
          bpx: "",
          spx: "",
          soldBy: ""
        });
        setEditingId(null);
        setIsDialogOpen(false);
        return;
      }

      let error;

      if (editingId) {
        // Update existing record
        const result = await supabase
          .from("gift_daily_sales")
          .update(payload)
          .eq("id", editingId as any);
        error = result.error;
      } else {
        // Create new record
        const result = await supabase
          .from("gift_daily_sales")
          .insert([payload]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingId ? "Sale updated successfully" : "Sale recorded successfully",
      });

      // Reset form
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        category: "",
        item: "",
        code: "",
        quantity: "1",
        unit: "Pc",
        bpx: "",
        spx: "",
        soldBy: ""
      });
      setEditingId(null);
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: editingId ? "Error updating sale" : "Error recording sale",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: GiftDailySale) => {
    // Split the combined item field back into category and item name
    const [category, ...itemNameParts] = item.item.split(": ");
    const itemName = itemNameParts.join(": ");

    setFormData({
      date: item.date,
      category: category || "",
      item: itemName || "",
      code: item.code || "",
      quantity: item.quantity.toString(),
      unit: item.unit,
      bpx: item.bpx.toString(),
      spx: item.spx.toString(),
      soldBy: item.sold_by || ""
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      const { error } = await supabase
        .from("gift_daily_sales")
        .delete()
        .eq("id", id as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sale deleted successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error deleting sale",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalSales = items.reduce((sum, item) => sum + (item.spx * item.quantity), 0);
  const totalProfit = items.reduce((sum, item) => sum + ((item.spx - item.bpx) * item.quantity), 0);

  // Get sales person name from profiles
  const getSalesPersonName = (soldById: string) => {
    const profile = salesProfiles.find(p => p.id === soldById);
    return profile ? `${profile.sales_initials} - ${profile.full_name}` : "Unknown";
  };

  return (
    <div className="space-y-8 p-6">
      {/* Offline status indicator */}
      {isOffline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-center">
            <WifiOff className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-700 font-medium">Offline Mode: Sales will be saved locally and synced when online</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="daily-sales" className="space-y-8">
        <TabsList className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-1 shadow-lg">
          <TabsTrigger
            value="daily-sales"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Daily Sales
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-sales" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                Daily Gift Store Sales
              </h3>
              <p className="text-muted-foreground">Track and manage today's gift store sales</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  // Reset form when closing
                  setFormData({
                    date: new Date().toISOString().slice(0, 10),
                    category: "",
                    item: "",
                    code: "",
                    quantity: "1",
                    unit: "Pc",
                    bpx: "",
                    spx: "",
                    soldBy: ""
                  });
                  setEditingId(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Syncing...
                      </div>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Sale
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {editingId ? '✏️ Edit Sale' : '✨ Record New Sale'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Category *</Label>
                      <Input
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="e.g., Birthday"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Item Name *</Label>
                      <Input
                        value={formData.item}
                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                        placeholder="e.g., Birthday Card"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Description (Optional)</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Item description"
                        className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Selling Price (UGX) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.spx}
                          onChange={(e) => setFormData({ ...formData, spx: e.target.value })}
                          required
                          className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          required
                          className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Date *</Label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                          className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Unit *</Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) => setFormData({ ...formData, unit: value })}
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-200">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pc">Pc</SelectItem>
                            <SelectItem value="Set">Set</SelectItem>
                            <SelectItem value="Box">Box</SelectItem>
                            <SelectItem value="Pack">Pack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Stock Buying Price (UGX) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.bpx}
                          onChange={(e) => setFormData({ ...formData, bpx: e.target.value })}
                          required
                          className="border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Profit (UGX)
                        </Label>
                        <Input
                          value={calculatedProfit.toFixed(2)}
                          disabled
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Added By (Initials)</Label>
                      <Select
                        value={formData.soldBy}
                        onValueChange={(value) => setFormData({ ...formData, soldBy: value })}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              salesProfiles.length > 0
                                ? "Select sales person"
                                : "No sales persons available"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_specified">Not Specified</SelectItem>
                          {salesProfiles.length > 0 ? (
                            salesProfiles.map(profile => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.sales_initials} - {profile.full_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no_sales_persons" disabled>
                              No sales persons with initials found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {salesProfiles.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          No users have sales initials assigned. Visit Admin Profile to assign initials.
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center gap-2">
                        {editingId ? '✏️ Update Sale' : '✨ Record Sale'}
                      </div>
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-600 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">UGX {totalSales.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">UGX {totalProfit.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                  <Gift className="h-6 w-6" />
                </div>
                Today's Sales Records
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {items.length + offlineGiftSales.length} records
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50">
                    <TableRow className="border-b border-green-100">
                      <TableHead className="font-semibold text-gray-700">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700">Item</TableHead>
                      <TableHead className="font-semibold text-gray-700">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stock Buying Price</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Selling Price</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total Value</TableHead>
                      <TableHead className="font-semibold text-gray-700">Profit</TableHead>
                      <TableHead className="font-semibold text-gray-700">Added By</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Offline sales */}
                    {offlineGiftSales.map((sale, index) => {
                      const profit = (sale.spx - sale.bpx) * sale.quantity;
                      const totalValue = sale.quantity * sale.bpx;
                      const saleDate = new Date(sale.date);
                      const [category, ...itemNameParts] = sale.item.split(": ");
                      const itemName = itemNameParts.join(": ");

                      return (
                        <TableRow
                          key={sale.id}
                          className="group hover:bg-gradient-to-r transition-all duration-300 bg-yellow-50 border-l-4 border-yellow-400"
                        >
                          <TableCell className="font-medium">{category || "-"}</TableCell>
                          <TableCell className="font-semibold text-gray-800">{itemName || sale.item}</TableCell>
                          <TableCell className="text-gray-600">{sale.code || "-"}</TableCell>
                          <TableCell className="font-medium text-blue-600">UGX {formatUGX(sale.bpx)}</TableCell>
                          <TableCell className="font-medium">{sale.quantity}</TableCell>
                          <TableCell className="font-medium text-purple-600">UGX {formatUGX(sale.spx)}</TableCell>
                          <TableCell className="font-bold text-indigo-700">UGX {formatUGX(sale.spx * sale.quantity)}</TableCell>
                          <TableCell className="font-bold text-green-600">UGX {formatUGX((sale.spx - sale.bpx) * sale.quantity)}</TableCell>
                          <TableCell className="font-medium">
                            {sale.sold_by ? getSalesPersonName(sale.sold_by) : "Not specified"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-xs text-yellow-600 font-medium">Pending Sync</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Online sales */}
                    {items.length > 0 ? (
                      items.map((item, index) => {
                        const profit = (item.spx - item.bpx) * item.quantity;
                        const totalValue = item.quantity * item.bpx;
                        const saleDate = new Date(item.date);
                        const [category, ...itemNameParts] = item.item.split(": ");
                        const itemName = itemNameParts.join(": ");

                        return (
                          <TableRow
                            key={item.id}
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 hover:from-green-50 hover:to-emerald-50`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="font-medium text-gray-600">{category || "-"}</TableCell>
                            <TableCell className="font-semibold text-gray-800 max-w-xs truncate">{itemName || item.item}</TableCell>
                            <TableCell className="text-gray-600">{item.description || item.code || "-"}</TableCell>
                            <TableCell className="font-medium text-blue-600">UGX {formatUGX(item.bpx)}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-purple-600">UGX {formatUGX(item.spx)}</TableCell>
                            <TableCell className="font-bold text-indigo-700">UGX {formatUGX(item.spx * item.quantity)}</TableCell>
                            <TableCell className="font-bold text-green-600">UGX {formatUGX((item.spx - item.bpx) * item.quantity)}</TableCell>
                            <TableCell className="font-medium">
                              {item.sold_by ? getSalesPersonName(item.sold_by) : "Not specified"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-green-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {loading ? (
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-lg text-gray-600">Loading sales records...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Gift className="h-12 w-12 text-gray-400" />
                                <span className="text-lg text-gray-600">No sales recorded today.</span>
                                <span className="text-sm text-gray-500">Start by recording your first sale!</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden p-6">
            <h3 className="text-xl font-bold mb-4">Inventory Management</h3>
            <p className="text-muted-foreground">Inventory management for gift store items is available in the main Gift Store Management section.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GiftsDailySales;