import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, AlertTriangle, Lock, Package2, TrendingUp, ShoppingCart, Star } from "lucide-react";
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
        .eq("id", id as any);

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
        .eq("id", editingId as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } else {
      // Create new item
      console.log("Inserting new item:", itemData);
      
      // DEBUG: Try a minimal insert first to isolate the issue
      const minimalData = {
        item: itemData.item,
        quantity: itemData.quantity,
        rate: itemData.rate,
        selling_price: itemData.selling_price
      };
      
      console.log("Trying minimal insert:", minimalData);
      
      // First try minimal insert
      let insertError = null;
      try {
        // Log the exact request being made
        console.log("Making insert request...");
        const { data, error } = await supabase
          .from("stationery")
          .insert([minimalData])
          .select();
          
        console.log("Insert response data:", data);
        console.log("Insert response error:", error);
        
        if (error) {
          insertError = error;
        } else {
          console.log("Minimal insert succeeded");
        }
      } catch (err) {
        console.error("Caught exception during insert:", err);
        insertError = err;
      }

      if (insertError) {
        console.error("Insert failed with error:", insertError);
        console.error("Error details:", JSON.stringify(insertError, null, 2));
        throw insertError;
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
        <TabsList className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-1 shadow-lg">
          <TabsTrigger 
            value="inventory" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <Package2 className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger 
            value="daily-sales" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 hover:scale-105 rounded-lg flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Daily Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
                <Package2 className="h-8 w-8 text-blue-600" />
                Stationery Management
              </h3>
              <p className="text-muted-foreground">Manage your stationery inventory with smart tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-full max-w-md">
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
                type="stationery"
                moduleTitle="Stationery Inventory"
                disabled={items.length === 0}
              />
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                  <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {editingId ? '✏️ Edit Item' : '✨ Add New Item'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({...formData, category: value})}
                        >
                          <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-200">
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
                          onChange={(e) => setFormData({...formData, item: e.target.value})}
                          required
                          className={`transition-all duration-200 ${formErrors.item ? "border-red-500 focus:border-red-500" : "border-blue-200 focus:border-blue-400 focus:ring-blue-200"}`}
                        />
                        {formErrors.item && <span className="text-red-500 text-sm flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{formErrors.item}</span>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-medium">Description</Label>
                        <Input
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Quantity *</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            required
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Rate (UGX) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.rate}
                            onChange={(e) => setFormData({...formData, rate: e.target.value})}
                            required
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
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
                            onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                            required
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
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
                            className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Low Stock Threshold</Label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.low_stock_threshold}
                          onChange={(e) => setFormData({...formData, low_stock_threshold: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Sold By (Initials)</Label>
                        <Select
                          value={formData.sold_by}
                          onValueChange={(value) => setFormData({...formData, sold_by: value})}
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
            <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-blue-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
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
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <TableRow className="border-b border-blue-100">
                      <TableHead className="font-semibold text-gray-700">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700">Item</TableHead>
                      <TableHead className="font-semibold text-gray-700">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Qty</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rate (UGX)</TableHead>
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
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 ${
                              isLowStock 
                                ? "bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-l-4 border-red-400" 
                                : "hover:from-blue-50 hover:to-purple-50"
                            }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                                {item.category || "-"}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800">{item.item}</TableCell>
                            <TableCell className="text-gray-600">{item.description || "-"}</TableCell>
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
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-lg text-gray-600">Loading awesome items...</span>
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