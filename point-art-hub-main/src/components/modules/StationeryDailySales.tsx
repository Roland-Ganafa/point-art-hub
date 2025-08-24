import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { format } from "date-fns";

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
  const [salesProfiles, setSalesProfiles] = useState<Array<{id: string, sales_initials: string, full_name: string}>>([]);
  const [saleData, setSaleData] = useState({
    item_id: "",
    quantity: "1",
    sold_by: "",
  });
  const { toast } = useToast();
  const { profile } = useUser();

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
      console.log("Sales profiles fetched:", data);
      setSalesProfiles(data || []);
      
      // If no profiles with initials found, check all profiles
      if (!data || data.length === 0) {
        const { data: allProfiles, error: allError } = await supabase
          .from("profiles")
          .select("id, sales_initials, full_name");
        console.log("All profiles:", allProfiles);
        if (allError) console.error("Error fetching all profiles:", allError);
      }
    } catch (error) {
      console.error("Error fetching sales profiles:", error);
    }
  };

  const fetchSales = async () => {
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
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const item = items.find((i) => i.id === saleData.item_id);
    if (!item) return;

    const quantity = parseInt(saleData.quantity);
    const totalAmount = quantity * item.selling_price;
    const profit = quantity * (item.profit_per_unit || 0); // Use actual profit per unit

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

    if (error) {
      toast({
        title: "Error recording sale",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });
      setIsDialogOpen(false);
      setSaleData({
        item_id: "",
        quantity: "1",
        sold_by: "",
      });
      fetchSales();
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    const { error } = await supabase.from("stationery_sales").delete().eq("id", saleId);

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
      fetchSales();
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Today's Sales</h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <Label>Item</Label>
                <Select
                  value={saleData.item_id}
                  onValueChange={(value) => setSaleData({ ...saleData, item_id: value })}
                >
                  <SelectTrigger>
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
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={saleData.quantity}
                  onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Sold By</Label>
                <Select
                  value={saleData.sold_by}
                  onValueChange={(value) => setSaleData({ ...saleData, sold_by: value })}
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
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Sold By</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.item_name}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>UGX {sale.selling_price.toLocaleString()}</TableCell>
                    <TableCell>UGX {sale.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                          {sale.sales_person_initials || 'N/A'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sale.sales_person_name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(sale.date), "hh:mm a")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No sales recorded today
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

export default StationeryDailySales;
