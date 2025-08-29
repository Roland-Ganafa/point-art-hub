import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, TrendingUp, ShoppingCart, Package2, Star, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";
import { useOffline } from "@/hooks/useOffline";
import { useOfflineSales } from "@/hooks/useOfflineSales";

interface Sale {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  selling_price: number;
  total_amount: number;
  profit: number;
  date: string;
  sold_by: string | null;
  sales_person_name?: string;
  sales_person_initials?: string;
}

interface StationeryDailySalesProps {
  items: Array<{ id: string; item: string; selling_price: number; stock: number; rate: number; profit_per_unit: number }>;
}

const StationeryDailySales = ({ items }: StationeryDailySalesProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [salesProfiles, setSalesProfiles] = useState<Array<{id: string, sales_initials: string, full_name: string}>>([]);
  const [saleData, setSaleData] = useState({
    item_id: "",
    quantity: "1",
    sold_by: "",
  });
  const { toast } = useToast();
  const { profile } = useUser();
  const { isOffline } = useOffline();
  const { 
    offlineSales, 
    recordOfflineSale, 
    syncOfflineSales,
    isSyncing 
  } = useOfflineSales();

  useEffect(() => {
    fetchSales();
    fetchSalesProfiles();
  }, []);

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

  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from("stationery_sales")
        .select(`
          *, 
          stationery:item_id(item),
          profiles:sold_by(sales_initials, full_name)
        `)
        .gte("date", startOfDay)
        .lte("date", endOfDay)
        .order("date", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching sales",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSales(
          data?.map((sale) => ({
            ...sale,
            item_name: sale.stationery?.item || "Unknown Item",
            sales_person_name: sale.profiles?.full_name || "Unknown",
            sales_person_initials: sale.profiles?.sales_initials || "N/A",
          })) || []
        );
      }
    } catch (error) {
      toast({
        title: "Error fetching sales",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const item = items.find((i) => i.id === saleData.item_id);
    if (!item) {
      toast({
        title: "Error",
        description: "Please select a valid item",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(saleData.quantity);
    if (quantity > item.stock) {
      toast({
        title: "Error",
        description: "Quantity cannot exceed available stock",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = quantity * item.selling_price;
    const profit = quantity * (item.profit_per_unit || 0);

    try {
      // If offline, store sale locally
      if (isOffline) {
        const offlineSale = recordOfflineSale({
          item_id: saleData.item_id,
          quantity,
          selling_price: item.selling_price,
          total_amount: totalAmount,
          profit,
          sold_by: saleData.sold_by || profile?.id || null,
        });

        toast({
          title: "Offline Mode",
          description: "Sale recorded locally. Will sync when online.",
          variant: "warning",
        });

        setIsDialogOpen(false);
        setSaleData({
          item_id: "",
          quantity: "1",
          sold_by: "",
        });
        return;
      }

      // Online mode - insert into database
      const { error } = await supabase.from("stationery_sales").insert([
        {
          item_id: saleData.item_id,
          quantity,
          selling_price: item.selling_price,
          total_amount: totalAmount,
          profit,
          sold_by: saleData.sold_by || profile?.id || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });
      
      // Update the item stock
      const { error: updateError } = await supabase
        .from("stationery")
        .update({ stock: item.stock - quantity })
        .eq("id", saleData.item_id);

      if (updateError) {
        console.error("Error updating stock:", updateError);
      }

      setIsDialogOpen(false);
      setSaleData({
        item_id: "",
        quantity: "1",
        sold_by: "",
      });
      fetchSales();
    } catch (error) {
      toast({
        title: "Error recording sale",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    
    try {
      // First get the sale details to restore stock
      const { data: saleData, error: fetchError } = await supabase
        .from("stationery_sales")
        .select("item_id, quantity")
        .eq("id", saleId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase.from("stationery_sales").delete().eq("id", saleId);

      if (error) throw error;

      // Restore the stock
      if (saleData) {
        const { data: itemData, error: itemError } = await supabase
          .from("stationery")
          .select("stock")
          .eq("id", saleData.item_id)
          .single();

        if (!itemError && itemData) {
          await supabase
            .from("stationery")
            .update({ stock: itemData.stock + saleData.quantity })
            .eq("id", saleData.item_id);
        }
      }

      toast({
        title: "Success",
        description: "Sale deleted successfully",
      });
      fetchSales();
    } catch (error) {
      toast({
        title: "Error deleting sale",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  // Sync offline sales when coming back online
  useEffect(() => {
    if (!isOffline && offlineSales.length > 0) {
      syncOfflineSales();
    }
  }, [isOffline]);

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
        <TabsList className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-1 shadow-lg">
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
            <Package2 className="h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily-sales" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                Daily Stationery Sales
              </h3>
              <p className="text-muted-foreground">Track and manage today's stationery sales</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      ✨ Record New Sale
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Item *</Label>
                      <Select
                        value={saleData.item_id}
                        onValueChange={(value) => setSaleData({ ...saleData, item_id: value })}
                        required
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items
                            .filter((item) => item.stock > 0)
                            .map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.item} (Stock: {item.stock})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-medium">Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        max={items.find(i => i.id === saleData.item_id)?.stock || 1}
                        value={saleData.quantity}
                        onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                        required
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Sold By (Initials)</Label>
                      <Select
                        value={saleData.sold_by}
                        onValueChange={(value) => setSaleData({ ...saleData, sold_by: value })}
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
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Record Sale
                      </div>
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-600 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">UGX {totalSales.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">UGX {totalProfit.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-blue-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                  <Package2 className="h-6 w-6" />
                </div>
                Today's Sales Records
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {sales.length + offlineSales.length} records
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <TableRow className="border-b border-blue-100">
                      <TableHead className="font-semibold text-gray-700">Item</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Price (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Profit (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Sold By</TableHead>
                      <TableHead className="font-semibold text-gray-700">Time</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Offline sales */}
                    {offlineSales.map((sale, index) => {
                      const item = items.find(i => i.id === sale.item_id);
                      return (
                        <TableRow 
                          key={sale.id} 
                          className="group hover:bg-gradient-to-r transition-all duration-300 bg-yellow-50 border-l-4 border-yellow-400"
                        >
                          <TableCell className="font-semibold text-gray-800">
                            <div className="flex items-center gap-2">
                              <WifiOff className="h-4 w-4 text-yellow-600" />
                              {item?.item || "Unknown Item"}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{sale.quantity}</TableCell>
                          <TableCell className="font-medium text-blue-600">{sale.selling_price.toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-purple-600">{sale.total_amount.toLocaleString()}</TableCell>
                          <TableCell className={`font-bold ${sale.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`h-4 w-4 ${sale.profit >= 0 ? "text-green-500" : "text-red-500"}`} />
                              {sale.profit.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            Offline
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-xs text-yellow-600 font-medium">Pending Sync</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Online sales */}
                    {sales.length > 0 ? (
                      sales.map((sale, index) => (
                        <TableRow 
                          key={sale.id} 
                          className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 hover:from-blue-50 hover:to-purple-50`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell className="font-semibold text-gray-800">{sale.item_name}</TableCell>
                          <TableCell className="font-medium">{sale.quantity}</TableCell>
                          <TableCell className="font-medium text-blue-600">{sale.selling_price.toLocaleString()}</TableCell>
                          <TableCell className="font-bold text-purple-600">{sale.total_amount.toLocaleString()}</TableCell>
                          <TableCell className={`font-bold ${sale.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`h-4 w-4 ${sale.profit >= 0 ? "text-green-500" : "text-red-500"}`} />
                              {sale.profit.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {sale.sales_person_initials !== "N/A" ? sale.sales_person_initials : "Not specified"}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-red-100 hover:scale-110 transition-all duration-200"
                              onClick={() => handleDeleteSale(sale.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {isLoading ? (
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-lg text-gray-600">Loading sales records...</span>
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
        </TabsContent>

        <TabsContent value="inventory" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden p-6">
            <h3 className="text-xl font-bold mb-4">Inventory Management</h3>
            <p className="text-muted-foreground">Inventory management for stationery items is available in the main Stationery Management section.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StationeryDailySales;