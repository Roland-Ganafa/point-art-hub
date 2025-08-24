import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { AlertTriangle } from "lucide-react";
import GiftsDailySales from "./GiftsDailySales";
import ExportDialog from "@/components/ExportDialog";

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface GiftStoreItem {
  id: string;
  item: string;
  category: string;
  custom_category: string | null;
  quantity: number;
  rate: number;
  stock: number;
  selling_price: number;
  profit_per_unit: number;
  low_stock_threshold: number;
  sales: number;
  sold_by: string | null;
  date: string;
}


interface GiftStoreModuleProps { openAddTrigger?: number }
const GiftStoreModule = ({ openAddTrigger }: GiftStoreModuleProps) => {
  const [items, setItems] = useState<GiftStoreItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const lastProcessedTrigger = useRef<number>(0);
  const [formData, setFormData] = useState({
    item: "",
    category: "cleaning",
    custom_category: "",
    quantity: "",
    rate: "",
    selling_price: "",
    low_stock_threshold: "",
  });
  const { toast } = useToast();
  const { isAdmin } = useUser();

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.custom_category && item.custom_category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open the add dialog when triggered from Dashboard
  useEffect(() => {
    if (openAddTrigger && openAddTrigger !== lastProcessedTrigger.current) {
      lastProcessedTrigger.current = openAddTrigger;
      setIsDialogOpen(true);
    }
  }, [openAddTrigger]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("gift_store")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching gift store items",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
  };

  const handleEdit = (item: GiftStoreItem) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit items",
        variant: "destructive",
      });
      return;
    }
    
    setEditingId(item.id);
    setFormData({
      item: item.item,
      category: item.category,
      custom_category: item.custom_category || "",
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      selling_price: item.selling_price.toString(),
      low_stock_threshold: item.low_stock_threshold.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete items",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const { error } = await supabase
        .from("gift_store")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      fetchItems();
    } catch (error) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const itemData = {
        item: formData.item,
        category: formData.category as "cleaning" | "kids_toys" | "birthday" | "custom",
        custom_category: formData.category === "custom" ? formData.custom_category : null,
        quantity: parseInt(formData.quantity),
        rate: parseFloat(formData.rate),
        selling_price: parseFloat(formData.selling_price || "0"),
        low_stock_threshold: parseInt(formData.low_stock_threshold || "0"),
      };

      if (editingId) {
        // Update existing item
        const { error } = await supabase
          .from("gift_store")
          .update(itemData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Gift store item updated successfully",
        });
      } else {
        // Create new item
        const { error } = await supabase.from("gift_store").insert([itemData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Gift store item added successfully",
        });
      }

      setIsDialogOpen(false);
      setFormData({
        item: "",
        category: "cleaning",
        custom_category: "",
        quantity: "",
        rate: "",
        selling_price: "",
        low_stock_threshold: "",
      });
      setEditingId(null);
      fetchItems();
    } catch (error) {
      toast({
        title: editingId ? "Error updating item" : "Error adding item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="daily-sales">Daily Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Gift Store Management</h3>
              <p className="text-gray-600 mt-1">Manage your gift store inventory</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-9 border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <ExportDialog
                data={items}
                type="gift_store"
                moduleTitle="Gift Store Inventory"
                disabled={items.length === 0}
              />
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingId(null);
                  setFormData({
                    item: "",
                    category: "cleaning",
                    custom_category: "",
                    quantity: "",
                    rate: "",
                    selling_price: "",
                    low_stock_threshold: "",
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Gift Store Item" : "Add Gift Store Item"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="item">Item Name</Label>
                    <Input
                      id="item"
                      value={formData.item}
                      onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="kids_toys">Kids Toys</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.category === "custom" && (
                    <div>
                      <Label htmlFor="custom_category">Custom Category</Label>
                      <Input
                        id="custom_category"
                        value={formData.custom_category}
                        onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate">Rate (UGX)</Label>
                      <Input
                        id="rate"
                        type="number"
                        step="0.01"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="selling_price">Selling Price (UGX)</Label>
                      <Input
                        id="selling_price"
                        type="number"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                      <Input
                        id="low_stock_threshold"
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">{editingId ? "Update Item" : "Add Item"}</Button>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Gift Store Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate (UGX)</TableHead>
                    <TableHead>Stock (UGX)</TableHead>
                    <TableHead>Selling Price (UGX)</TableHead>
                    <TableHead>Profit/Unit (UGX)</TableHead>
                    <TableHead>Sales (UGX)</TableHead>
                    <TableHead>Sales By</TableHead>
                    <TableHead>Date Sold</TableHead>
                    <TableHead>Low Stock Alert</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const isLowStock = item.stock <= item.low_stock_threshold;
                    return (
                      <TableRow key={item.id} className={isLowStock ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell className="capitalize">
                          {item.category === "custom" ? item.custom_category : item.category.replace("_", " ")}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatUGX(item.rate)}</TableCell>
                        <TableCell className="font-semibold text-green-600">{formatUGX(item.stock)}</TableCell>
                        <TableCell>{formatUGX(item.selling_price)}</TableCell>
                        <TableCell>{formatUGX(item.profit_per_unit)}</TableCell>
                        <TableCell className="font-semibold">{formatUGX(item.sales)}</TableCell>
                        <TableCell>{item.sold_by || "-"}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">Low Stock</span>
                            </div>
                          ) : (
                            <span className="text-green-600 text-xs">Good</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(item)}
                              disabled={!isAdmin}
                              title={!isAdmin ? "Admin access required" : "Edit item"}
                            >
                              {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDelete(item.id)}
                              disabled={!isAdmin}
                              title={!isAdmin ? "Admin access required" : "Delete item"}
                            >
                              {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground">
                        {searchTerm ? "No items match your search." : "No gift store items found. Add your first item above."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-sales">
          <GiftsDailySales />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GiftStoreModule;