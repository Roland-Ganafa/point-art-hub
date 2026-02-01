import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import CustomLoader from "@/components/ui/CustomLoader";
import { Plus, Edit, Trash2, Search, AlertTriangle, Lock, Package2, TrendingUp, ShoppingCart, Star, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useOffline } from "@/hooks/useOffline";
import StationeryDailySales from "./StationeryDailySales";
import ExportDialog from "@/components/ExportDialog";
import { Database } from "@/integrations/supabase/types";

const CATEGORIES = [
  "Office Supplies",
  "School Supplies",
  "Art Materials",
  "Writing Instruments",
  "Paper Products",
  "Desk Accessories"
];

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface StationeryItem {
  id: string;
  category: string;
  item: string;
  description: string | null;
  quantity: number;
  rate: number;
  stock?: number; // Make stock optional since it might not exist in older schemas
  selling_price: number;
  date: string;
  sold_by: string | null;
  low_stock_threshold?: number; // Make optional
  profit_per_unit?: number; // Make optional
}

type ProfileItem = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "sales_initials" | "full_name">;

interface StationeryModuleProps { openAddTrigger?: number }
const StationeryModule = ({ openAddTrigger }: StationeryModuleProps) => {
  const [items, setItems] = useState<StationeryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [salesProfiles, setSalesProfiles] = useState<ProfileItem[]>([]);
  const { isAdmin } = useUser();
  const { isOffline } = useOffline();
  const lastProcessedTrigger = useRef<number>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Handle bulk selection
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
        description: "Only administrators can delete items",
        variant: "destructive",
      });
      return;
    }

    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

    try {
      const { error } = await supabase
        .from("stationery")
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
      console.error("Error in handleBulkDelete:", error);
      toast({
        title: "Error deleting items",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    item: "",
    description: "",
    quantity: "",
    rate: "",
    selling_price: "",
    profit_per_unit: "0",
    low_stock_threshold: "5",
    sold_by: "not_specified",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredItems.forEach(item => {
      const cat = item.category || "Uncategorized";
      const value = (item.stock || item.quantity || 0) * (item.rate || 0);
      totals[cat] = (totals[cat] || 0) + value;
    });
    return totals;
  }, [filteredItems]);

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
      setSalesProfiles(data as unknown as ProfileItem[] || []);

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

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("stationery")
        .select("*")
        .order("category", { ascending: true })
        .order("item", { ascending: true });

      if (error) throw error;

      // Process the data to ensure all required fields are present
      const processedData = (data as unknown as StationeryItem[] || []).map(item => ({
        ...item,
        // Ensure stock field exists, fallback to quantity if missing
        stock: item.stock !== undefined ? item.stock : item.quantity,
        // Ensure other fields exist with default values
        profit_per_unit: item.profit_per_unit || 0,
        low_stock_threshold: item.low_stock_threshold || 5,
      }));

      setItems(processedData);
    } catch (error: any) {
      console.error("Error fetching items:", error);

      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.code === "42501") {
        errorMessage = "Database permission error. This is likely due to a missing database column. Please run the database migration to fix this issue.";
      }

      toast({
        title: "Error fetching items",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (item: StationeryItem) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit items",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to edit items",
        variant: "destructive",
      });
      return;
    }

    setEditingId(item.id);
    setFormData({
      category: item.category || CATEGORIES[0],
      item: item.item,
      description: item.description || "",
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      selling_price: item.selling_price.toString(),
      profit_per_unit: item.profit_per_unit?.toString() || "0",
      low_stock_threshold: item.low_stock_threshold?.toString() || "5",
      sold_by: item.sold_by || "not_specified",
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

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete items",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("stationery")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      fetchItems();
    } catch (error: any) {
      console.error("Error in handleDelete:", error);

      let errorMessage = error.message;
      if (error.status === 401) {
        errorMessage = "Authentication failed. Please log in and try again.";
      } else if (error.status === 403) {
        errorMessage = "Access denied. You may not have permission to perform this action.";
      }

      toast({
        title: "Error deleting item",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.item.trim()) {
      errors.item = "Item name is required";
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      errors.rate = "Rate must be greater than 0";
    }

    if (!formData.selling_price || parseFloat(formData.selling_price) <= 0) {
      errors.selling_price = "Selling price must be greater than 0";
    }

    if (parseFloat(formData.selling_price) < parseFloat(formData.rate)) {
      errors.selling_price = "Selling price should be greater than or equal to rate";
    }

    if (!formData.low_stock_threshold || parseInt(formData.low_stock_threshold) < 0) {
      errors.low_stock_threshold = "Low stock threshold must be 0 or greater";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData: any = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        rate: parseFloat(formData.rate) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        profit_per_unit: parseFloat(formData.profit_per_unit) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        sold_by: formData.sold_by === "not_specified" ? null : formData.sold_by,
      };

      // Only add stock field if it's supported by the database
      // This handles cases where the database migration hasn't been applied yet
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .from("stationery")
          .select("*")
          .limit(1);

        if (!schemaError && schemaData && schemaData.length > 0) {
          // Check if stock column exists in the schema
          if ("stock" in schemaData[0]) {
            itemData.stock = parseInt(formData.quantity) || 0; // Stock should be equal to initial quantity
          }
        }
      } catch (schemaCheckError) {
        console.warn("Could not check schema, proceeding without stock field:", schemaCheckError);
      }

      // DEBUG: Log the data being sent
      console.log("Inserting stationery item with data:", itemData);
      console.log("Data keys:", Object.keys(itemData));

      // Check if user is authenticated before attempting to insert
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("Current session:", session?.user?.id);
      console.log("Session error:", sessionError);

      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add items to the inventory. No active session found.",
          variant: "destructive",
        });
        return;
      }

      // Additional debug: Check user role and authentication status
      if (session?.user?.id) {
        console.log("User is authenticated with ID:", session.user.id);
        console.log("User email:", session.user.email);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('user_id', session.user.id)
          .single();

        console.log("User profile:", profile);
        console.log("Profile error:", profileError);
        console.log("User is admin:", profile?.role === 'admin');

        // Check if user exists in profiles table
        if (profileError) {
          console.warn("Could not fetch user profile:", profileError);
          // Try to create profile if it doesn't exist
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert([
              {
                user_id: session.user.id,
                full_name: session.user.email || 'Unknown User',
                role: 'user'
              }
            ]);

          if (createProfileError) {
            console.error("Failed to create profile:", createProfileError);
          } else {
            console.log("Created profile for user");
          }
        }
      }

      if (editingId) {
        // Update existing item
        console.log("Updating item with ID:", editingId);
        const { error } = await supabase
          .from("stationery")
          .update(itemData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Item updated successfully",
        });
      } else {
        // Create new item
        console.log("Inserting new item:", itemData);

        const { data, error } = await supabase
          .from("stationery")
          .insert([itemData])
          .select();

        if (error) {
          console.error("Insert failed with error:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          throw error;
        }

        toast({
          title: "Success",
          description: "Item added successfully",
        });
      }

      setIsDialogOpen(false);
      setFormData({
        category: CATEGORIES[0],
        item: "",
        description: "",
        quantity: "",
        rate: "",
        selling_price: "",
        profit_per_unit: "0",
        low_stock_threshold: "5",
        sold_by: "not_specified",
      });
      setEditingId(null);
      fetchItems();
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.status === 401) {
        errorMessage = "Authentication failed. Please log in and try again.";
      } else if (error.status === 403) {
        errorMessage = "Access denied. You may not have permission to perform this action.";
      } else if (error.code === "42501") {
        errorMessage = "Database permission error (RLS policy violation). This is a known issue that requires database administrator intervention. Please contact your system administrator. Error details: " + error.message;
      } else if (error.message.includes("new row violates row-level security policy")) {
        errorMessage = "RLS policy violation. The database is preventing this operation. This requires database administrator intervention to fix the RLS policies.";
      }

      toast({
        title: editingId ? "Error updating item" : "Error adding item",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      category: CATEGORIES[0],
      item: "",
      description: "",
      quantity: "",
      rate: "",
      selling_price: "",
      profit_per_unit: "0",
      low_stock_threshold: "5",
      sold_by: "not_specified",
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8 p-6">
      <Tabs defaultValue="inventory" className="space-y-8">
        <TabsList className="bg-muted border border-border rounded-xl p-1 shadow-lg">
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <Package2 className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger
            value="daily-sales"
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Daily Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 items-start">
            <div className="xl:col-span-3 space-y-1">
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Package2 className="h-6 w-6 text-blue-600" />
                Stationery
              </h3>
              <p className="text-xs text-muted-foreground">Smart inventory tracking</p>
            </div>

            <div className="xl:col-span-9 flex flex-wrap items-center gap-4 justify-end">
              {/* Total Stock Value Card - More Compact */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-xl p-3 shadow-md flex items-center gap-3 border border-green-500/20">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-green-50 uppercase tracking-tight">Total Value</p>
                  <p className="text-lg font-bold leading-tight">
                    {formatUGX(items.reduce((sum, item) => sum + ((item.stock || 0) * item.rate), 0))}
                  </p>
                </div>
              </div>

              {/* Category Breakdown Badges */}
              <div className="flex flex-wrap gap-2 items-center">
                {Object.entries(categoryTotals).map(([category, total]) => (
                  <div key={category} className="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 flex flex-col shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-blue-500 leading-none mb-0.5">{category}</span>
                    <span className="text-xs font-bold text-gray-700 leading-none">{formatUGX(total as number)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48 lg:w-64">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8 h-9 text-sm border-input focus:border-primary transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <ExportDialog
                  data={items}
                  type="stationery"
                  moduleTitle="Stationery Inventory"
                  disabled={items.length === 0}
                />

                {isAdmin && selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-9 shadow-sm"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete ({selectedIds.size})
                  </Button>
                )}

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetForm}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 h-9 px-4 shadow-sm"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-background border-border shadow-2xl" aria-describedby="add-item-desc">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-foreground">
                        {editingId ? 'Edit Item' : 'Add New Item'}
                      </DialogTitle>
                      <p id="add-item-desc" className="text-sm text-muted-foreground mt-1">Fill in the item details and submit to save.</p>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-medium text-foreground">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="border-input focus:border-primary focus:ring-primary bg-background">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-medium">Item Name *</Label>
                        <Input
                          value={formData.item}
                          onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                          required
                          className={`transition-all duration-200 bg-background ${formErrors.item ? "border-destructive focus:border-destructive" : "border-input focus:border-primary focus:ring-primary"}`}
                        />
                        {formErrors.item && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.item}</span>}
                      </div>

                      <div className="space-y-2">
                        <Label className="font-medium">Description</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="border-input focus:border-primary focus:ring-primary transition-all duration-200 bg-background"
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
                            className="border-input focus:border-primary focus:ring-primary transition-all duration-200 bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Stock Buying Price (UGX) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.rate}
                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                            required
                            className="border-input focus:border-primary focus:ring-primary transition-all duration-200 bg-background"
                          />
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
                            className="border-input focus:border-primary focus:ring-primary transition-all duration-200 bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Profit/Unit (UGX)
                          </Label>
                          <Input
                            value={formData.profit_per_unit}
                            disabled
                            className="bg-muted border-input font-medium text-muted-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground">Low Stock Threshold</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.low_stock_threshold}
                          onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-foreground">Added By (Initials)</Label>
                        <Select
                          value={formData.sold_by}
                          onValueChange={(value) => setFormData({ ...formData, sold_by: value })}
                        >
                          <SelectTrigger className="bg-background border-input">
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
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-lg hover:shadow-xl"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <CustomLoader size="sm" className="mr-2" />
                            Saving...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {editingId ? 'Update Item' : 'Add Item'}
                          </div>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <Card className="border-border shadow-2xl bg-card overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border">
              <CardTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                  <Package2 className="h-6 w-6" />
                </div>
                Stationery Inventory
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {filteredItems.length} items
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border hover:bg-muted/50">
                      {isAdmin && (
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                            className="translate-y-[2px]"
                          />
                        </TableHead>
                      )}
                      <TableHead className="w-[50px] font-semibold text-gray-700">#</TableHead>
                      <TableHead className="font-semibold text-gray-700">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700">Item</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-left">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Qty</TableHead>
                      <TableHead className="font-semibold text-gray-700">Stock Buying Price (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Total Value (UGX)</TableHead>
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
                        // Use stock if available, otherwise fallback to quantity
                        const actualStock = item.stock !== undefined ? item.stock : item.quantity;
                        const isLowStock = actualStock <= (item.low_stock_threshold || 5);
                        return (
                          <TableRow
                            key={item.id}
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 ${isLowStock
                              ? "bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-l-4 border-red-400"
                              : "hover:from-blue-50 hover:to-purple-50"
                              }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell>
                              {isAdmin && (
                                <Checkbox
                                  checked={selectedIds.has(item.id)}
                                  onCheckedChange={() => toggleSelectOne(item.id)}
                                  aria-label={`Select ${item.item}`}
                                  className="translate-y-[2px]"
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                                {item.category || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800">{item.item}</TableCell>
                            <TableCell className="text-gray-500 max-w-xs truncate text-left">{item.description || '-'}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-blue-600">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatUGX(item.quantity * item.rate)}
                            </TableCell>
                            <TableCell className="font-medium text-purple-600">{formatUGX(item.selling_price)}</TableCell>
                            <TableCell className={`font-bold ${item.profit_per_unit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              <div className="flex items-center gap-1">
                                <TrendingUp className={`h-4 w-4 ${item.profit_per_unit >= 0 ? "text-green-500" : "text-red-500"}`} />
                                {formatUGX(item.profit_per_unit)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {isLowStock ? (
                                <div className="flex items-center gap-2 text-red-600 font-semibold bg-red-100 px-3 py-1 rounded-full">
                                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                                  <span>LOW: {actualStock} units (Min: {item.low_stock_threshold || 5})</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-green-600 font-medium bg-green-100 px-3 py-1 rounded-full">
                                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                                  <span>Good: {actualStock} units</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(item)}
                                  disabled={!isAdmin}
                                  className="hover:scale-105 transition-transform duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={!isAdmin}
                                  className="hover:scale-105 transition-transform duration-200 hover:bg-red-50 hover:text-red-600 border-red-200"
                                >
                                  <Trash2 className="h-4 w-4" />
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
                              <div className="flex flex-col items-center gap-3">
                                <CustomLoader size="lg" />
                                <span className="text-lg text-gray-600 font-medium">Loading stationery items...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Package2 className="h-12 w-12 text-gray-400" />
                                <span className="text-lg text-gray-600">No items found.</span>
                                <span className="text-sm text-gray-500">Start by adding your first item!</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Totals Row */}
                    {filteredItems.length > 0 && (
                      <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-primary font-bold">
                        {isAdmin && <TableCell></TableCell>}
                        <TableCell colSpan={5} className="text-right text-lg font-bold text-gray-800">
                          TOTALS:
                        </TableCell>
                        <TableCell className="font-bold text-lg text-green-700">
                          {formatUGX(filteredItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0))}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell className="font-bold text-lg text-green-700">
                          {formatUGX(filteredItems.reduce((sum, item) => sum + (item.profit_per_unit || 0), 0) / filteredItems.length)}
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <StationeryDailySales />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StationeryModule;