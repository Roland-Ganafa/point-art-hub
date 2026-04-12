import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search, AlertTriangle, Lock, Gift, TrendingUp, ShoppingCart, Star, Download, FileText, ChevronDown, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import GiftsDailySales from "./GiftsDailySales";
import CustomLoader from "@/components/ui/CustomLoader";
import { prepareGiftStoreData, generatePDF, convertToCSV, downloadCSV } from "@/utils/exportUtils";

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface GiftStoreItem {
  id: string;
  item: string;
  category: string;
  custom_category: string | null;
  description: string | null;
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
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastProcessedTrigger = useRef<number>(0);
  const [formData, setFormData] = useState({
    item: "",
    category: "kids_toys",
    custom_category: "",
    description: "",
    quantity: "",
    rate: "",
    selling_price: "",
    low_stock_threshold: "",
    date: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { isAdmin, profile } = useUser();

  // Filter items based on search and date range
  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.custom_category && item.custom_category.toLowerCase().includes(searchTerm.toLowerCase()));
    const itemDate = item.date || (item.created_at ? item.created_at.split('T')[0] : '');
    const matchesStart = !filterStartDate || itemDate >= filterStartDate;
    const matchesEnd = !filterEndDate || itemDate <= filterEndDate;
    return matchesSearch && matchesStart && matchesEnd;
  });

  // Low stock items
  const lowStockItems = items.filter(item => {
    const stock = item.stock !== undefined ? item.stock : item.quantity;
    return stock <= (item.low_stock_threshold || 5);
  });

  // profit_per_unit is calculated directly in handleSubmit when saving

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
          ...item as any,
          // Ensure optional fields have default values if missing
          stock: (item as any).stock !== undefined ? (item as any).stock : undefined,
          selling_price: (item as any).selling_price !== undefined ? (item as any).selling_price : undefined,
          profit_per_unit: (item as any).profit_per_unit !== undefined ? (item as any).profit_per_unit : undefined,
          low_stock_threshold: (item as any).low_stock_threshold !== undefined ? (item as any).low_stock_threshold : undefined,
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
      description: item.description || "",
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      selling_price: item.selling_price !== undefined ? item.selling_price.toString() : "",
      low_stock_threshold: item.low_stock_threshold !== undefined ? item.low_stock_threshold.toString() : "",
      date: item.date || new Date().toISOString().split('T')[0],
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
        .eq("id", id as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can perform bulk deletion",
        variant: "destructive",
      });
      return;
    }

    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} items? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("gift_store")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.size} items deleted successfully`,
      });

      setSelectedIds(new Set());
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error deleting items",
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
        description: formData.description,
        category: formData.category as "cleaning" | "kids_toys" | "birthday" | "custom",
        quantity: parseInt(formData.quantity),
        rate: parseFloat(formData.rate),
        // Always include stock field with default value
        stock: parseInt(formData.quantity),
        // Include date field
        date: formData.date || new Date().toISOString().split('T')[0],
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
        itemData.selling_price = null;
        itemData.profit_per_unit = null;
        console.log("No selling price provided, setting to null");
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

      if (editingId) {
        // Update existing item
        const { error } = await supabase
          .from("gift_store")
          .update(itemData)
          .eq("id", editingId as any);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        // Create new item
        const { data, error } = await supabase.from("gift_store").insert([itemData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item added successfully",
        });

        console.log(data);
      }

      setIsDialogOpen(false);
      setFormData({
        item: "",
        category: "kids_toys",
        custom_category: "",
        description: "",
        quantity: "",
        rate: "",
        selling_price: "",
        low_stock_threshold: "",
        date: new Date().toISOString().split('T')[0],
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
      description: "",
      quantity: "",
      rate: "",
      selling_price: "",
      low_stock_threshold: "",
      date: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setFormErrors({});
    console.log("Form reset complete");
  };

  return (
    <div className="space-y-8 p-6">
      <Tabs defaultValue="inventory" className="space-y-8">
        <TabsList className="bg-gradient-to-r from-green-50 dark:from-green-950/30 to-emerald-50 border border-green-200 dark:border-green-800 rounded-xl p-1 shadow-lg">
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger
            value="daily-sales"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Daily Sales
          </TabsTrigger>
          <TabsTrigger
            value="low-stock"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Low Stock
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col gap-4 mb-8">
            {/* Title row */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Gift className="h-8 w-8 text-green-600" />
                  Gift Store Management
                </h3>
                <p className="text-muted-foreground">Manage your gift store inventory with style</p>
              </div>
            </div>

            {/* Filters + actions row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Date range */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-36 border-gray-300 focus:border-green-400 focus:ring-green-200 text-sm"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-36 border-gray-300 focus:border-green-400 focus:ring-green-200 text-sm"
                />
                {(filterStartDate || filterEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  className="pl-9 border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      const { headers, processedData } = prepareGiftStoreData(filteredItems);
                      const csv = convertToCSV(processedData, headers);
                      downloadCSV(csv, `gift-store-${new Date().toISOString().split('T')[0]}.csv`);
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      const { headers, processedData, summaryItems } = prepareGiftStoreData(filteredItems);
                      generatePDF(processedData, headers, 'Gift Store Inventory Report', `gift-store-${new Date().toISOString().split('T')[0]}.pdf`, summaryItems);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAdmin && selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="animate-in fade-in zoom-in duration-200 shadow-lg"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedIds.size})
                </Button>
              )}

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
                <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-2xl">
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
                        <SelectTrigger className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.category ? "border-red-500 focus:border-red-500" : ""}`}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
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
                          className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.custom_category ? "border-red-500 focus:border-red-500" : ""}`}
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
                        className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.item ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {formErrors.item && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.item}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Description</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                      />
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
                          className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.quantity ? "border-red-500 focus:border-red-500" : ""}`}
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
                          className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.rate ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.rate && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.rate}</span>}
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
                          className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.selling_price ? "border-red-500 focus:border-red-500" : ""}`}
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
                          className="bg-gradient-to-r from-green-50 dark:from-green-950/30 to-emerald-50 border-green-200 dark:border-green-800 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Low Stock Threshold</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                        className={`border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200 ${formErrors.low_stock_threshold ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {formErrors.low_stock_threshold && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.low_stock_threshold}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Date *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="border-green-200 dark:border-green-800 focus:border-green-400 focus:ring-green-200 transition-all duration-200"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <CustomLoader size="sm" className="mr-2" />
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

          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 dark:from-green-950/30 via-emerald-50 to-teal-50 border-b border-green-100 dark:border-green-900/50">
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
                <Table className="w-full">
                  <TableHeader className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 [&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                    <TableRow className="border-b border-green-100 dark:border-green-900/50">
                      {isAdmin && (
                        <TableHead className="w-[50px] bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50">
                          <Checkbox
                            checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                            className="translate-y-[2px]"
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[50px] font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">#</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Item</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-left bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Qty</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Rate (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Total Value (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Selling Price</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Profit/Unit</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Stock Date</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Stock Alert</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-green-50 whitespace-nowrap">Actions</TableHead>
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
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 ${isLowStock
                              ? "bg-gradient-to-r from-red-50 dark:from-red-950/30 to-pink-50 dark:to-pink-950/30 hover:from-red-100 hover:to-pink-100 dark:to-pink-900/30 border-l-4 border-red-400"
                              : "hover:from-green-50 dark:from-green-950/30 hover:to-emerald-50"
                              }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {isAdmin && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(item.id)}
                                  onCheckedChange={() => toggleSelectOne(item.id)}
                                  aria-label={`Select ${item.item}`}
                                  className="translate-y-[2px]"
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                                {item.category === "custom" ? item.custom_category : item.category.replace("_", " ")}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800 dark:text-gray-200">{item.item}</TableCell>
                            <TableCell className="text-gray-500 dark:text-gray-400 max-w-xs truncate text-left">{item.description || '-'}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-blue-600">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="font-medium text-green-600">{formatUGX(item.quantity * item.rate)}</TableCell>
                            <TableCell className="font-medium text-purple-600">{formatUGX(sellingPrice)}</TableCell>
                            <TableCell className={`font-bold ${profit && profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              <div className="flex items-center gap-1">
                                <TrendingUp className={`h-4 w-4 ${profit && profit >= 0 ? "text-green-500" : "text-red-500"}`} />
                                {formatUGX(profit)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <div className="flex items-center gap-2 text-red-600 font-semibold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                                  <span>LOW: {stock} left (Min: {lowStockThreshold})</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-green-600 font-medium bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
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
                                  className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleEdit(item)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Admin access required" : "Edit item"}
                                >
                                  {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4 text-blue-600" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/30 hover:scale-110 transition-all duration-200"
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
                        <TableCell colSpan={isAdmin ? 13 : 12} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-3">
                                <CustomLoader size="lg" />
                                <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">Loading gift items...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Gift className="h-12 w-12 text-gray-400" />
                                <span className="text-lg text-gray-600 dark:text-gray-400">No items found.</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">Start by adding your first item!</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Totals Row */}
                    {filteredItems.length > 0 && (
                      <TableRow className="bg-gradient-to-r from-green-50 dark:from-green-950/30 to-emerald-50 border-t-2 border-green-600 font-bold">
                        {isAdmin && <TableCell></TableCell>}
                        <TableCell colSpan={5} className="text-right text-lg font-bold text-gray-800 dark:text-gray-200">
                          TOTALS:
                        </TableCell>
                        <TableCell className="font-bold text-lg text-green-700">
                          {formatUGX(filteredItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0))}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="font-bold text-lg text-green-700">
                          {formatUGX(
                            filteredItems.reduce((sum, item) => {
                              const profit = item.selling_price && item.rate ? item.selling_price - item.rate : 0;
                              return sum + profit;
                            }, 0)
                          )}
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-sales" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <GiftsDailySales />
          </div>
        </TabsContent>

        <TabsContent value="low-stock" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-50 dark:from-red-950/30 via-orange-50 to-yellow-50 border-b border-red-100 dark:border-red-900/50">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-white">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                Low Stock Alert
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  {lowStockItems.length > 0 ? (
                    <Badge variant="destructive">{lowStockItems.length} items need restocking</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-600 border-green-300">All items well-stocked</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 [&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                    <TableRow className="border-b border-red-100 dark:border-red-900/50">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">#</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Item</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Current Stock</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Min Threshold</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Rate (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 whitespace-nowrap">Selling Price (UGX)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.length > 0 ? (
                      lowStockItems.map((item, index) => {
                        const stock = item.stock !== undefined ? item.stock : item.quantity;
                        const threshold = item.low_stock_threshold || 5;
                        const isCritical = stock === 0;
                        return (
                          <TableRow
                            key={item.id}
                            className={`animate-in slide-in-from-left-4 ${isCritical
                              ? "bg-gradient-to-r from-red-100 to-pink-100 dark:to-pink-900/30 border-l-4 border-red-600"
                              : "bg-gradient-to-r from-orange-50 dark:from-orange-950/30 to-yellow-50 border-l-4 border-orange-400"
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="font-medium text-gray-500 dark:text-gray-400">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {item.category === "custom" ? item.custom_category : item.category.replace("_", " ")}
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800 dark:text-gray-200">{item.item}</TableCell>
                            <TableCell className="text-gray-500 dark:text-gray-400 max-w-xs truncate">{item.description || '-'}</TableCell>
                            <TableCell className={`font-bold text-lg ${isCritical ? "text-red-700" : "text-orange-600"}`}>
                              {stock}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-400">{threshold}</TableCell>
                            <TableCell>
                              {isCritical ? (
                                <Badge variant="destructive" className="animate-pulse">Out of Stock</Badge>
                              ) : (
                                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 border border-orange-300">
                                  Low Stock
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-blue-600 font-medium">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="text-purple-600 font-medium">{formatUGX(item.selling_price)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-lg text-green-600 font-medium">All items are well-stocked!</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">No items are below their minimum threshold</span>
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
      </Tabs>
    </div>
  );
};

export default GiftStoreModule;