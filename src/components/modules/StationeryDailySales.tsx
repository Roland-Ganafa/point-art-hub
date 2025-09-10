import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, TrendingUp, ShoppingCart, Package2, Star, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { useOffline } from "@/hooks/useOffline";
import { useOfflineStationerySales } from "@/hooks/useOfflineStationerySales";
import { Database } from "@/integrations/supabase/types";

type StationeryDailySale = Database["public"]["Tables"]["stationery_daily_sales"]["Row"];
type ProfileItem = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "sales_initials" | "full_name">;

// Define interface for offline stationery sales
interface OfflineStationerySale {
  id: string;
  date: string;
  category: string;
  item: string;
  description: string | null;
  quantity: number;
  rate: number;
  selling_price: number;
  sold_by: string | null;
}

const formatUGX = (n: number | null | undefined) => {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n);
};

const StationeryDailySales = () => {
  const { toast } = useToast();
  const { profile } = useUser();
  const [items, setItems] = useState<StationeryDailySale[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [salesProfiles, setSalesProfiles] = useState<ProfileItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    item: "",
    description: "",
    quantity: "1",
    rate: "",
    selling_price: "",
    soldBy: ""          // UI only field
  });

  // Add offline functionality
  const { isOffline } = useOffline();
  const { 
    offlineStationerySales, 
    recordOfflineStationerySale, 
    syncOfflineStationerySales,
    isSyncing 
  } = useOfflineStationerySales();

  // Add calculated profit state
  const [calculatedProfit, setCalculatedProfit] = useState<number>(0);

  // Calculate profit whenever rate or selling price changes
  useEffect(() => {
    const rate = parseFloat(formData.rate) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    const quantity = parseInt(formData.quantity) || 1;
    const profit = (sellingPrice - rate) * quantity;
    setCalculatedProfit(profit);
  }, [formData.rate, formData.selling_price, formData.quantity]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // First fetch the sales data
      const { data, error } = await supabase
        .from("stationery_daily_sales")
        .select("*")
        .gte("date", startOfDay)
        .lte("date", endOfDay)
        .order("date", { ascending: false });

      if (error) {
        toast({ title: "Error fetching daily sales", description: error.message, variant: "destructive" });
      } else {
        setItems(data as unknown as StationeryDailySale[] || []);
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
      setSalesProfiles(data as ProfileItem[] || []);
      
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
    if (!isOffline && offlineStationerySales.length > 0) {
      syncOfflineStationerySales();
    }
  }, [isOffline]);

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
    const rate = parseFloat(formData.rate) || 0;
    const sellingPrice = parseFloat(formData.selling_price) || 0;
    
    if (quantity <= 0) {
      toast({ title: "Validation Error", description: "Quantity must be a positive number", variant: "destructive" });
      return;
    }
    
    if (rate < 0) {
      toast({ title: "Validation Error", description: "Rate cannot be negative", variant: "destructive" });
      return;
    }
    
    if (sellingPrice < 0) {
      toast({ title: "Validation Error", description: "Selling price cannot be negative", variant: "destructive" });
      return;
    }
    
    const payload: any = {
      date: formData.date,
      category: formData.category,
      item: formData.item,
      description: formData.description ? formData.description.trim() : null,
      quantity: quantity,
      rate: rate,
      selling_price: sellingPrice,
      profit_per_unit: sellingPrice - rate,
      total_value: quantity * rate,
      sold_by: formData.soldBy === "not_specified" ? null : formData.soldBy
    };
    
    try {
      // If offline, store sale locally
      if (isOffline) {
        const offlineSale = {
          date: formData.date,
          category: formData.category,
          item: formData.item,
          description: formData.description ? formData.description.trim() : null,
          quantity: quantity,
          rate: rate,
          selling_price: sellingPrice,
          profit_per_unit: sellingPrice - rate,
          total_value: quantity * rate,
          sold_by: formData.soldBy === "not_specified" ? null : formData.soldBy
        };

        recordOfflineStationerySale(offlineSale);

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
          description: "",
          quantity: "1",
          rate: "",
          selling_price: "",
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
          .from("stationery_daily_sales")
          .update(payload)
          .eq("id", editingId as any);
        error = result.error;
      } else {
        // Create new record
        const result = await supabase
          .from("stationery_daily_sales")
          .insert([payload] as any);
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
        description: "",
        quantity: "1",
        rate: "",
        selling_price: "",
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

  const handleEdit = (item: StationeryDailySale) => {
    setFormData({
      date: item.date,
      category: item.category,
      item: item.item,
      description: item.description || "",
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      selling_price: item.selling_price.toString(),
      soldBy: item.sold_by || ""
    });
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    
    try {
      const { error } = await supabase
        .from("stationery_daily_sales")
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

  const totalSales = items.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const totalProfit = items.reduce((sum, item) => sum + ((item.selling_price - item.rate) * item.quantity), 0);

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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="space-y-2">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            Daily Stationery Sales
          </h3>
          <p className="text-muted-foreground">Track and manage today's stationery sales</p>
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
                description: "",
                quantity: "1",
                rate: "",
                selling_price: "",
                soldBy: ""
              });
              setEditingId(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingId ? '✏️ Edit Sale' : '✨ Record New Sale'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Category *</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Item *</Label>
                  <Input
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    required
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium">Rate (UGX) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Selling Price (UGX) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      required
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                    />
                  </div>
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
                
                <div className="space-y-2">
                  <Label>Sold By</Label>
                  <Select
                    value={formData.soldBy}
                    onValueChange={(value) => setFormData({ ...formData, soldBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_specified">Not Specified</SelectItem>
                      {salesProfiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.sales_initials} - {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {editingId ? '✏️ Update Sale' : '✨ Record Sale'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
              <Package2 className="h-6 w-6" />
            </div>
            Today's Sales
            <div className="ml-auto flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Total: UGX {formatUGX(totalSales)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-medium">Profit: UGX {formatUGX(totalProfit)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{items.length} sales</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                <TableRow className="border-b border-blue-100">
                  <TableHead className="font-semibold text-gray-700">Category</TableHead>
                  <TableHead className="font-semibold text-gray-700">Item</TableHead>
                  <TableHead className="font-semibold text-gray-700">Description</TableHead>
                  <TableHead className="font-semibold text-gray-700">Rate</TableHead>
                  <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                  <TableHead className="font-semibold text-gray-700">Sold by</TableHead>
                  <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item, index) => {
                    return (
                      <TableRow 
                        key={item.id} 
                        className="group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 hover:from-blue-50 hover:to-purple-50"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-medium text-gray-600">{item.category}</TableCell>
                        <TableCell className="font-semibold text-gray-800 max-w-xs truncate">{item.item}</TableCell>
                        <TableCell className="text-gray-600">{item.description || "-"}</TableCell>
                        <TableCell className="font-medium text-blue-600">UGX {formatUGX(item.rate)}</TableCell>
                        <TableCell className="font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-gray-600">
                          {item.sold_by ? getSalesPersonName(item.sold_by) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
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
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        {loading ? (
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-lg text-gray-600">Loading daily sales...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <Package2 className="h-12 w-12 text-gray-400" />
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
    </div>
  );
};

export default StationeryDailySales;