import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, AlertTriangle, Lock, Gift, TrendingUp, ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
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
  stock?: number;
  selling_price?: number;
  profit_per_unit?: number;
  low_stock_threshold?: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const lastProcessedTrigger = useRef<number>(0);
  const [formData, setFormData] = useState({
    item: "",
    category: "kids_toys",
    custom_category: "",
    quantity: "",
    rate: "",
    selling_price: "",
    low_stock_threshold: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { isAdmin, profile } = useUser();

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.custom_category && item.custom_category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate profit when rate or selling price changes
  useEffect(() => {
    if (formData.rate && formData.selling_price) {
      const rate = parseFloat(formData.rate) || 0;
      const sellingPrice = parseFloat(formData.selling_price) || 0;
      const profit = sellingPrice - rate;
      setFormData(prev => ({
        ...prev,
        profit_per_unit: profit.toFixed(2)
      }));
    }
  }, [formData.rate, formData.selling_price]);

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
    try {
      setIsLoading(true);
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
        // Process the data to ensure all required fields are present
        const processedData = data?.map(item => ({
          ...item,
          // Ensure optional fields have default values if missing
          stock: item.stock !== undefined ? item.stock : undefined,
          selling_price: item.selling_price !== undefined ? item.selling_price : undefined,
          profit_per_unit: item.profit_per_unit !== undefined ? item.profit_per_unit : undefined,
          low_stock_threshold: item.low_stock_threshold !== undefined ? item.low_stock_threshold : undefined,
        })) || [];
        
        setItems(processedData);
      }
    } catch (error: any) {
      console.error("Exception in fetchItems:", error);
      toast({
        title: "Error fetching gift store items",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    console.log("=== FORM VALIDATION ===");
    console.log("Form data:", formData);

    if (!formData.item.trim()) {
      errors.item = "Item name is required";
      console.log("Item name validation failed");
    }

    const quantity = parseInt(formData.quantity);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      errors.quantity = "Quantity must be a valid number greater than 0";
      console.log("Quantity validation failed:", { value: formData.quantity, parsed: quantity });
    }

    const rate = parseFloat(formData.rate);
    if (!formData.rate || isNaN(rate) || rate <= 0) {
      errors.rate = "Rate must be a valid number greater than 0";
      console.log("Rate validation failed:", { value: formData.rate, parsed: rate });
    }

    const sellingPrice = parseFloat(formData.selling_price);
    if (!formData.selling_price || isNaN(sellingPrice) || sellingPrice <= 0) {
      errors.selling_price = "Selling price must be a valid number greater than 0";
      console.log("Selling price validation failed:", { value: formData.selling_price, parsed: sellingPrice });
    }

    if (!isNaN(sellingPrice) && !isNaN(rate) && sellingPrice < rate) {
      errors.selling_price = "Selling price should be greater than or equal to rate";
      console.log("Selling price vs rate validation failed:", { sellingPrice, rate });
    }

    // Only validate low_stock_threshold if it has a value
    if (formData.low_stock_threshold && formData.low_stock_threshold !== "") {
      const lowStockThreshold = parseInt(formData.low_stock_threshold);
      if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        errors.low_stock_threshold = "Low stock threshold must be a valid number 0 or greater";
        console.log("Low stock threshold validation failed:", { value: formData.low_stock_threshold, parsed: lowStockThreshold });
      }
    }
    // If low_stock_threshold is empty, that's fine - it's optional

    console.log("Validation errors:", errors);
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log("Form is valid:", isValid);
    return isValid;
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
      selling_price: item.selling_price !== undefined ? item.selling_price.toString() : "",
      low_stock_threshold: item.low_stock_threshold !== undefined ? item.low_stock_threshold.toString() : "",
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
    
    console.log("=== GIFT STORE FORM SUBMISSION ===");
    console.log("Form data before validation:", formData);
    console.log("User profile:", profile);
    console.log("Is admin:", isAdmin);
    
    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    console.log("Form errors:", formErrors);
    
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting. Check the browser console for details.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare item data, handling optional fields
      const itemData: any = {
        item: formData.item,
        category: formData.category as "cleaning" | "kids_toys" | "birthday" | "custom",
        quantity: parseInt(formData.quantity),
        rate: parseFloat(formData.rate),
        // Always include stock field with default value
        stock: parseInt(formData.quantity),
        // Include date field
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        // Set default sales value
        sales: 0,
      };

      console.log("Prepared base item data:", itemData);

      // Validate category
      const validCategories = ["cleaning", "kids_toys", "birthday", "custom"];
      if (!validCategories.includes(itemData.category)) {
        console.error("Invalid category:", itemData.category);
        toast({
          title: "Invalid Category",
          description: `Category must be one of: ${validCategories.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Add sold_by field if user is available
      if (profile?.id) {
        itemData.sold_by = profile.id;
        console.log("Added sold_by from profile:", profile.id);
      } else {
        console.warn("No profile ID available for sold_by field - this might cause issues if the field is required");
        // Let's check if sold_by is actually required in the database
        // For now, we'll set it to null and see if that works
        itemData.sold_by = null;
      }

      // Only add optional fields if they have values
      if (formData.category === "custom" && formData.custom_category) {
        itemData.custom_category = formData.custom_category;
        console.log("Added custom_category:", formData.custom_category);
      } else if (formData.category !== "custom") {
        // Explicitly set custom_category to null when not using custom category
        itemData.custom_category = null;
        console.log("Set custom_category to null for non-custom category");
      }
      
      if (formData.selling_price) {
        const sellingPrice = parseFloat(formData.selling_price);
        itemData.selling_price = sellingPrice;
        itemData.profit_per_unit = sellingPrice - parseFloat(formData.rate);
        console.log("Added selling price and profit:", {
          selling_price: sellingPrice,
          profit_per_unit: itemData.profit_per_unit
        });
      } else {
        // Set default values for selling_price and profit_per_unit when not provided
        itemData.selling_price = 0;
        itemData.profit_per_unit = 0 - parseFloat(formData.rate);
        console.log("Set default selling price and profit:", {
          selling_price: 0,
          profit_per_unit: itemData.profit_per_unit
        });
      }
      
      // Handle low_stock_threshold - set to default 5 if not provided
      if (formData.low_stock_threshold && formData.low_stock_threshold !== "") {
        itemData.low_stock_threshold = parseInt(formData.low_stock_threshold);
        console.log("Added low_stock_threshold:", itemData.low_stock_threshold);
      } else {
        itemData.low_stock_threshold = 5; // Default value
        console.log("Set default low_stock_threshold:", itemData.low_stock_threshold);
      }

      console.log("Final item data being sent to database:", itemData);

      // Let's add a more detailed check before sending to database
      const requiredFields = ['item', 'category', 'quantity', 'rate'];
      const missingFields = requiredFields.filter(field => {
        const value = itemData[field];
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        toast({
          title: "Missing Required Fields",
          description: `The following fields are required: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      // Validate numeric fields
      const numericFields = ['quantity', 'rate', 'stock', 'selling_price', 'profit_per_unit', 'low_stock_threshold'];
      const invalidNumericFields = numericFields.filter(field => {
        const value = itemData[field];
        return value !== undefined && value !== null && (isNaN(Number(value)) || Number(value) < 0);
      });

      if (invalidNumericFields.length > 0) {
        console.error("Invalid numeric fields:", invalidNumericFields);
        toast({
          title: "Invalid Numeric Fields",
          description: `The following fields have invalid values: ${invalidNumericFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      let error;
      let data;
      if (editingId) {
        console.log("Updating existing item with ID:", editingId);
        // Update existing item
        const result = await supabase
          .from("gift_store")
          .update(itemData)
          .eq("id", editingId);
        error = result.error;
        data = result.data;
        console.log("Update result:", { error, data });
      } else {
        console.log("Creating new item with data:", itemData);
        // Create new item
        const result = await supabase.from("gift_store").insert([itemData]);
        error = result.error;
        data = result.data;
        console.log("Insert result:", { error, data });
      }

      if (error) {
        console.error("=== DATABASE ERROR ===");
        console.error("Database error:", error);
        console.error("Item data being sent:", itemData);
        toast({
          title: editingId ? "Error updating item" : "Error adding item",
          description: `${error.message} (Code: ${error.code || 'N/A'})`,
          variant: "destructive",
        });
        return;
      }

      console.log("=== SUCCESS ===");
      console.log("Success response:", data);
      toast({
        title: "Success",
        description: editingId ? "Gift store item updated successfully" : "Gift store item added successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        item: "",
        category: "kids_toys",
        custom_category: "",
        quantity: "",
        rate: "",
        selling_price: "",
        low_stock_threshold: "",
      });
      setEditingId(null);
      setFormErrors({});
      fetchItems();
    } catch (error: any) {
      console.error("=== EXCEPTION ===");
      console.error("Exception:", error);
      toast({
        title: editingId ? "Error updating item" : "Error adding item",
        description: error.message || "An unexpected error occurred. Check the browser console for details.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    console.log("Resetting form to default values");
    setFormData({
      item: "",
      category: "kids_toys",
      custom_category: "",
      quantity: "",
      rate: "",
      selling_price: "",
      low_stock_threshold: "", // Changed from "5" to "" to match the form's initial state
    });
    setEditingId(null);
    setFormErrors({});
    console.log("Form reset complete");
  };

  return (
    <div className="space-y-8 p-6">
      <Tabs defaultValue="inventory" className="space-y-8">
        <TabsList className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-1 shadow-lg">
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger 
            value="daily-sales" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Daily Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                <Gift className="h-8 w-8 text-green-600" />
                Gift Store Management
              </h3>
              <p className="text-muted-foreground">Manage your gift store inventory with style</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-9 border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
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
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {editingId ? '✏️ Edit Gift Store Item' : '✨ Add New Gift Store Item'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({ ...formData, category: value })} 
                        required
                      >
                        <SelectTrigger className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.category ? "border-red-500 focus:border-red-500" : ""}`}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kids_toys">Kids Toys</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.category && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.category}</span>}
                    </div>
                    
                    {formData.category === "custom" && (
                      <div className="space-y-2">
                        <Label className="font-medium">Custom Category *</Label>
                        <Input
                          value={formData.custom_category}
                          onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                          required
                          className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.custom_category ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.custom_category && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.custom_category}</span>}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="font-medium">Item Name *</Label>
                      <Input
                        value={formData.item}
                        onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                        required
                        className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.item ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {formErrors.item && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.item}</span>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Quantity *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          required
                          className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.quantity ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.quantity && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.quantity}</span>}
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Rate (UGX) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.rate}
                          onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                          required
                          className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.rate ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.rate && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-33 w-3" />{formErrors.rate}</span>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Selling Price (UGX) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.selling_price}
                          onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                          required
                          className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.selling_price ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.selling_price && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.selling_price}</span>}
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Profit/Unit (UGX)
                        </Label>
                        <Input
                          value={formData.selling_price && formData.rate ? 
                            (parseFloat(formData.selling_price) - parseFloat(formData.rate)).toFixed(2) : "0"}
                          disabled
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 font-medium"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-medium">Low Stock Threshold</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                        className={`border-green-200 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.low_stock_threshold ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {formErrors.low_stock_threshold && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.low_stock_threshold}</span>}
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {editingId ? '✏️ Update Item' : '✨ Add Item'}
                        </div>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                  <Gift className="h-6 w-6" />
                </div>
                Gift Store Inventory
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {filteredItems.length} items
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
                      <TableHead className="font-semibold text-gray-700">Qty</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rate (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stock</TableHead>
                      <TableHead className="font-semibold text-gray-700">Selling Price</TableHead>
                      <TableHead className="font-semibold text-gray-700">Profit/Unit</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stock Date</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stock Alert</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => {
                        // Handle optional fields safely
                        const stock = item.stock !== undefined ? item.stock : item.quantity;
                        const sellingPrice = item.selling_price !== undefined ? item.selling_price : null;
                        const lowStockThreshold = item.low_stock_threshold !== undefined ? item.low_stock_threshold : 5;
                        const isLowStock = stock !== null && stock <= lowStockThreshold;
                        const profit = sellingPrice !== null && item.rate ? sellingPrice - item.rate : null;
                        
                        return (
                          <TableRow 
                            key={item.id} 
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 ${
                              isLowStock 
                                ? "bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-l-4 border-red-400" 
                                : "hover:from-green-50 hover:to-emerald-50"
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                {item.category === "custom" ? item.custom_category : item.category.replace("_", " ")}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800">{item.item}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-blue-600">{formatUGX(item.rate)}</TableCell>
                            <TableCell className={`font-bold ${isLowStock ? "text-red-600 animate-pulse" : "text-green-600"}`}>
                              {stock}
                            </TableCell>
                            <TableCell className="font-medium text-purple-600">{formatUGX(sellingPrice)}</TableCell>
                            <TableCell className={`font-bold ${profit && profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              <div className="flex items-center gap-1">
                                <TrendingUp className={`h-4 w-4 ${profit && profit >= 0 ? "text-green-500" : "text-red-500"}`} />
                                {formatUGX(profit)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <div className="flex items-center gap-2 text-red-600 font-semibold bg-red-100 px-3 py-1 rounded-full">
                                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                                  <span>LOW: {stock} left (Min: {lowStockThreshold})</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span>Good: {stock} in stock</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleEdit(item)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Admin access required" : "Edit item"}
                                >
                                  {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4 text-blue-600" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 hover:bg-red-100 hover:scale-110 transition-all duration-200"
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
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={11} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {isLoading ? (
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-lg text-gray-600">Loading awesome items...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Gift className="h-12 w-12 text-gray-400" />
                                <span className="text-lg text-gray-600">No items found.</span>
                                <span className="text-sm text-gray-500">Start by adding your first item!</span>
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

        <TabsContent value="daily-sales" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <GiftsDailySales />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GiftStoreModule;