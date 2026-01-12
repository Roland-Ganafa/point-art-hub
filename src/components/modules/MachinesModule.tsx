import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Lock, Monitor, TrendingUp, ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import ExportDialog from "@/components/ExportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import CustomLoader from "@/components/ui/CustomLoader";

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface MachineService {
  id: string;
  machine_name: string;
  service_description: string;
  quantity: number;
  rate: number;
  sales: number;
  expenditure?: number;
  done_by: string | null;
  date: string;
}

interface MachinesModuleProps { openAddTrigger?: number }
const MachinesModule = ({ openAddTrigger }: MachinesModuleProps) => {
  const [items, setItems] = useState<MachineService[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ... existing useEffects ...

  // ... existing useEffects ...

  // ... existing code ...


  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastProcessedTrigger = useRef<number>(0);
  const [salesProfiles, setSalesProfiles] = useState<Array<{ id: string, sales_initials: string, full_name: string }>>([]);
  const [formData, setFormData] = useState({
    machine_name: "printer",
    service_description: "",
    quantity: "",
    rate: "",
    expenditure: "",
    sold_by: "",
    color_type: "bw", // "bw" | "colored"
    laminate_type: "id" // "id" | "a4" | "a3"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { isAdmin, profile } = useUser();

  // Auto-calculate rate based on rules
  useEffect(() => {
    // Only auto-calculate if not editing (or if we decide editing should also auto-calc, but usually user might want to keep custom rate)
    // Actually, usually beneficial to auto-calc even during edit if they change parameters, but let's stick to standard behavior.
    // Let's allow auto-calc but be careful not to overwrite if user manually typed something different? 
    // For now, strict adherence to rules:

    if (!formData.quantity) return;
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty <= 0) return;

    let newRate = 0;

    switch (formData.machine_name) {
      case "printer":
        if (formData.color_type === "bw") {
          if (qty >= 1 && qty <= 10) newRate = 1000;
          else if (qty >= 11 && qty <= 20) newRate = 700;
          else if (qty >= 21) newRate = 500;
        } else { // colored
          if (qty >= 1 && qty <= 10) newRate = 2000;
          else if (qty >= 11 && qty <= 20) newRate = 1500;
          else if (qty >= 21) newRate = 1000;
        }
        break;

      case "copier":
        if (formData.color_type === "bw") {
          if (qty >= 1 && qty <= 10) newRate = 300;
          else if (qty >= 11) newRate = 200;
        } else { // colored
          if (qty >= 1 && qty <= 10) newRate = 1000;
          else if (qty >= 11) newRate = 500;
        }
        break;

      case "scanner":
        if (qty >= 1 && qty <= 10) newRate = 1000;
        else if (qty >= 11) newRate = 500;
        break;

      case "laminator":
        // Per unit pricing
        if (formData.laminate_type === "id") newRate = 1000;
        else if (formData.laminate_type === "a4") newRate = 2000;
        else if (formData.laminate_type === "a3") newRate = 4000;
        break;

      default:
        // binding stays as is (custom entry)
        return;
    }

    if (newRate > 0) {
      setFormData(prev => ({
        ...prev,
        rate: newRate.toString(),
        expenditure: (newRate * 0.2).toFixed(2) // 20% of rate
      }));
    }
  }, [formData.quantity, formData.machine_name, formData.color_type, formData.laminate_type]);

  // Auto-calculate expenditure when rate changes manually (or automatically)
  useEffect(() => {
    if (formData.rate) {
      const rateVal = parseFloat(formData.rate);
      if (!isNaN(rateVal) && rateVal > 0) {
        // Only update if it's significantly different to avoid loops or fighting input
        // But since this is a calculated field, maybe we just set it?
        // User asked "system is supposed to put automatically after the user puts in the rate"
        // So if user types rate, expenditure should update.
        // We need to be careful not to overwrite if they try to edit expenditure? 
        // User demand implies enforced rule: "expenditure is 20% for all".
        const newExp = (rateVal * 0.2).toFixed(2);
        if (formData.expenditure !== newExp) {
          setFormData(prev => ({ ...prev, expenditure: newExp }));
        }
      }
    }
  }, [formData.rate]);

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.service_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.done_by && item.done_by.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching machine services",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setItems((data as unknown as MachineService[]) || []);
      }
    } catch (error) {
      toast({
        title: "Error fetching machine services",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
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
        description: "Only administrators can delete services",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected items?`)) return;

    try {
      const { error } = await supabase
        .from("machines")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedIds.size} services deleted successfully`,
      });

      setSelectedIds(new Set());
      fetchItems();
    } catch (error) {
      toast({
        title: "Error deleting services",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.service_description.trim()) {
      errors.service_description = "Service description is required";
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      errors.rate = "Rate must be greater than 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = (item: MachineService) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can edit services",
        variant: "destructive",
      });
      return;
    }

    setEditingId(item.id);
    setFormData({
      machine_name: item.machine_name,
      service_description: item.service_description,
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      expenditure: item.expenditure?.toString() || "",
      sold_by: item.done_by || "",
      color_type: "bw", // Defaults as we don't store this in DB specifically
      laminate_type: "id"
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can delete services",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Are you sure you want to delete this machine service?")) return;

    try {
      const { error } = await supabase
        .from("machines")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Machine service deleted successfully",
      });

      fetchItems();
    } catch (error) {
      toast({
        title: "Error deleting service",
        description: error.message,
        variant: "destructive",
      });
    }
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

    const serviceData = {
      machine_name: formData.machine_name as "printer" | "copier" | "scanner" | "binder" | "laminator",
      service_description: formData.service_description,
      quantity: parseInt(formData.quantity),
      rate: parseFloat(formData.rate),
      expenditure: formData.expenditure ? parseFloat(formData.expenditure) : 0,
      done_by: formData.sold_by || profile?.id || null
    };

    try {
      let error;

      if (editingId) {
        // Update existing service
        const result = await supabase
          .from("machines")
          .update(serviceData as any)
          .eq("id", editingId);
        error = result.error;
      } else {
        // Create new service
        const result = await supabase.from("machines").insert([serviceData] as any);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingId ? "Machine service updated successfully" : "Machine service added successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        machine_name: "printer",
        service_description: "",
        quantity: "",
        rate: "",
        expenditure: "",
        sold_by: "",
        color_type: "bw",
        laminate_type: "id"
      });
      setEditingId(null);
      setFormErrors({});
      fetchItems();
    } catch (error) {
      toast({
        title: editingId ? "Error updating service" : "Error adding service",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      machine_name: "printer",
      service_description: "",
      quantity: "",
      rate: "",
      expenditure: "",
      sold_by: "",
      color_type: "bw",
      laminate_type: "id"
    });
    setEditingId(null);
    setFormErrors({});
  };

  return (
    <div className="space-y-8 p-6">
      <Tabs defaultValue="inventory" className="space-y-8">
        <TabsList className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-1 shadow-lg">
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
              <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <Monitor className="h-8 w-8 text-blue-600" />
                Machine Services
              </h3>
              <p className="text-muted-foreground">Manage your machine services with detailed tracking</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Today's Sales Summary */}
              <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm flex flex-col items-end min-w-[140px]">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Today's Sales</span>
                <span className="text-lg font-bold text-green-600">
                  {formatUGX(items
                    .filter(item => {
                      const today = new Date().toISOString().split('T')[0];
                      return item.date === today;
                    })
                    .reduce((sum, item) => sum + (item.rate * item.quantity), 0)
                  )}
                </span>
              </div>

              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-9 border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="animate-in fade-in zoom-in duration-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedIds.size})
                </Button>
              )}

              <ExportDialog
                data={items}
                type="machines"
                moduleTitle="Machine Services"
                disabled={items.length === 0}
              />

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {editingId ? '✏️ Edit Machine Service' : '✨ Add New Machine Service'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Machine Type *</Label>
                      <Select
                        value={formData.machine_name}
                        onValueChange={(value) => {
                          setFormData(prev => ({
                            ...prev,
                            machine_name: value,
                            // Reset specialized fields when machine changes
                            color_type: "bw",
                            laminate_type: "id",
                            rate: ""
                          }));
                        }}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                          <SelectValue placeholder="Select machine type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="printer">Printer</SelectItem>
                          <SelectItem value="copier">Copier</SelectItem>
                          <SelectItem value="scanner">Scanner</SelectItem>
                          <SelectItem value="binder">Binder</SelectItem>
                          <SelectItem value="laminator">Laminator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dynamic Fields based on Machine Type */}
                    {(formData.machine_name === "printer" || formData.machine_name === "copier") && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="font-medium">Print Color</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="bw"
                              name="color_type"
                              value="bw"
                              checked={formData.color_type === "bw"}
                              onChange={(e) => setFormData({ ...formData, color_type: e.target.value })}
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor="bw" className="cursor-pointer">Black & White</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="colored"
                              name="color_type"
                              value="colored"
                              checked={formData.color_type === "colored"}
                              onChange={(e) => setFormData({ ...formData, color_type: e.target.value })}
                              className="accent-blue-600 h-4 w-4"
                            />
                            <Label htmlFor="colored" className="cursor-pointer">Colored</Label>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.machine_name === "laminator" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="font-medium">Paper Size</Label>
                        <Select
                          value={formData.laminate_type}
                          onValueChange={(value) => setFormData({ ...formData, laminate_type: value })}
                        >
                          <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                            <SelectValue placeholder="Select paper size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="id">IDs</SelectItem>
                            <SelectItem value="a4">A4 Papers</SelectItem>
                            <SelectItem value="a3">A3 Papers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="font-medium">Service Description *</Label>
                      <Textarea
                        value={formData.service_description}
                        onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                        required
                        className={`border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200 ${formErrors.service_description ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {formErrors.service_description && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.service_description}</span>}
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
                          className={`border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200 ${formErrors.quantity ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.quantity && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.quantity}</span>}
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
                            className={`border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200 ${formErrors.rate ? "border-red-500 focus:border-red-500" : ""}`}
                          />
                          {formErrors.rate && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.rate}</span>}
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Expenditure (UGX)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.expenditure}
                            onChange={(e) => setFormData({ ...formData, expenditure: e.target.value })}
                            placeholder="Optional"
                            className="border-blue-200 focus:border-blue-400 focus:ring-blue-200 transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Done By (Initials)</Label>
                      <Select
                        value={formData.sold_by}
                        onValueChange={(value) => setFormData({ ...formData, sold_by: value })}
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
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <CustomLoader size="sm" className="mr-2" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {editingId ? '✏️ Update Service' : '✨ Add Service'}
                        </div>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 border-b border-blue-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg text-white">
                  <Monitor className="h-6 w-6" />
                </div>
                Machine Services
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {filteredItems.length} services
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <TableRow className="border-b border-blue-100">
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                          onChange={toggleSelectAll}
                          className="accent-blue-600 h-4 w-4"
                        />
                      </TableHead>
                      <TableHead className="w-[30px] font-semibold text-gray-700">#</TableHead>
                      <TableHead className="font-semibold text-gray-700">Machine Type</TableHead>
                      <TableHead className="font-semibold text-gray-700">Service Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rate (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Sales (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Expenditure</TableHead>
                      <TableHead className="font-semibold text-gray-700">Profit</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date</TableHead>
                      <TableHead className="font-semibold text-gray-700">Done By</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => {
                        const sales = item.rate * item.quantity;
                        const profit = sales - (item.expenditure || 0);
                        return (
                          <TableRow
                            key={item.id}
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 hover:from-blue-50 hover:to-cyan-50 ${selectedIds.has(item.id) ? "bg-blue-50" : ""}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelectOne(item.id)}
                                className="accent-blue-600 h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium text-gray-600">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                                {item.machine_name.charAt(0).toUpperCase() + item.machine_name.slice(1)}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800 max-w-xs truncate">{item.service_description}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-blue-600">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="font-medium text-cyan-600">{formatUGX(sales)}</TableCell>
                            <TableCell className="font-medium text-red-600">{formatUGX(item.expenditure || 0)}</TableCell>
                            <TableCell className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              <div className="flex items-center gap-1">
                                <TrendingUp className={`h-4 w-4 ${profit >= 0 ? "text-green-500" : "text-red-500"}`} />
                                {formatUGX(profit)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(item.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {item.done_by ? salesProfiles.find(p => p.id === item.done_by)?.sales_initials || item.done_by : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleEdit(item)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Admin access required" : "Edit service"}
                                >
                                  {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4 text-blue-600" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Admin access required" : "Delete service"}
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
                        <TableCell colSpan={12} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-3">
                                <CustomLoader size="lg" />
                                <span className="text-lg text-gray-600 font-medium">Loading machine services...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Monitor className="h-12 w-12 text-gray-400" />
                                <span className="text-lg text-gray-600">No machine services found.</span>
                                <span className="text-sm text-gray-500">Start by adding your first service!</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Totals Row */}
                    {filteredItems.length > 0 && (
                      <TableRow className="bg-blue-50/50 font-bold border-t-2 border-blue-200">
                        <TableCell colSpan={6} className="text-right text-gray-700">TOTALS</TableCell>
                        <TableCell className="text-cyan-700">
                          {formatUGX(filteredItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0))}
                        </TableCell>
                        <TableCell className="text-red-700">
                          {formatUGX(filteredItems.reduce((sum, item) => sum + (item.expenditure || 0), 0))}
                        </TableCell>
                        <TableCell className="text-green-700">
                          {formatUGX(filteredItems.reduce((sum, item) => sum + ((item.rate * item.quantity) - (item.expenditure || 0)), 0))}
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Sales Report - {viewMode === 'daily' ? selectedDate.toLocaleDateString() : selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>

              <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 bg-blue-50/50 rounded-md p-1">
                  <Button
                    variant={viewMode === 'daily' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('daily')}
                    className={`h-7 px-3 text-xs ${viewMode === 'daily' ? 'bg-white text-blue-600 shadow-sm border border-blue-100 hover:bg-white' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('monthly')}
                    className={`h-7 px-3 text-xs ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-sm border border-blue-100 hover:bg-white' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}
                  >
                    Monthly
                  </Button>
                </div>

                <div className="h-4 w-px bg-blue-200 mx-1" />

                <div className="flex items-center gap-2">
                  <Input
                    type={viewMode === 'daily' ? "date" : "month"}
                    value={
                      viewMode === 'daily'
                        ? selectedDate.toISOString().split('T')[0]
                        : selectedDate.toISOString().slice(0, 7)
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        // When picking a month "YYYY-MM", new Date("YYYY-MM") defaults to UTC.
                        // This may shift to previous month in local time. 
                        // Check strictly if it's month input
                        if (viewMode === 'monthly') {
                          const [year, month] = e.target.value.split('-').map(Number);
                          // Create date using local time constructor, but set to noon to avoid timezone shifts
                          // when converting to ISO string (which converts to UTC)
                          setSelectedDate(new Date(year, month - 1, 1, 12, 0, 0));
                        } else {
                          // "YYYY-MM-DD" usually naturally works better, but let's be safe
                          setSelectedDate(new Date(e.target.value));
                        }
                      }
                    }}
                    className="h-7 w-[130px] text-xs border-0 bg-transparent focus:ring-0 cursor-pointer text-gray-600 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <TableRow>
                    <TableHead className="w-[50px] font-semibold text-gray-700">#</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-left">Machine Category</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Total Sales (UGX)</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Total Profit (UGX)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["printer", "copier", "scanner", "laminator", "binder"].map((type, index) => {
                    // Filter items based on selectedDate and viewMode
                    const filteredDailyItems = items.filter(item => {
                      if (item.machine_name !== type) return false;
                      // item.date is YYYY-MM-DD string from standard input/db

                      if (viewMode === 'daily') {
                        // Compare string YYYY-MM-DD directly
                        // We need key from selectedDate. 
                        // selectedDate from input value "YYYY-MM-DD" -> new Date("YYYY-MM-DD") -> UTC
                        // toISOString().split('T')[0] gives back "YYYY-MM-DD" safely if it was parsed as UTC
                        return item.date === selectedDate.toISOString().split('T')[0];
                      } else {
                        // Compare YYYY-MM
                        // item.date "YYYY-MM-DD" -> slice(0, 7) -> "YYYY-MM"
                        // selectedDate.toISOString().slice(0, 7) -> "YYYY-MM"
                        return item.date.slice(0, 7) === selectedDate.toISOString().slice(0, 7);
                      }
                    });

                    const totalSales = filteredDailyItems.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
                    const totalExpenditure = filteredDailyItems.reduce((sum, item) => sum + (item.expenditure || 0), 0);
                    const totalProfit = totalSales - totalExpenditure;

                    if (totalSales === 0) return null;

                    return (
                      <TableRow key={type} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium capitalize">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                            {type}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-blue-600">{formatUGX(totalSales)}</TableCell>
                        <TableCell className="text-right font-bold text-green-600">{formatUGX(totalProfit)}</TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Grand Totals */}
                  <TableRow className="bg-gradient-to-r from-blue-100 to-cyan-100 font-bold border-t-2 border-blue-300">
                    <TableCell colSpan={2} className="text-gray-800">GRAND TOTAL</TableCell>
                    <TableCell className="text-right text-blue-800">
                      {formatUGX(items
                        .filter(item => {
                          if (viewMode === 'daily') {
                            return item.date === selectedDate.toISOString().split('T')[0];
                          } else {
                            return item.date.slice(0, 7) === selectedDate.toISOString().slice(0, 7);
                          }
                        })
                        .reduce((sum, item) => sum + (item.rate * item.quantity), 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right text-green-800">
                      {formatUGX(items
                        .filter(item => {
                          if (viewMode === 'daily') {
                            return item.date === selectedDate.toISOString().split('T')[0];
                          } else {
                            return item.date.slice(0, 7) === selectedDate.toISOString().slice(0, 7);
                          }
                        })
                        .reduce((sum, item) => sum + ((item.rate * item.quantity) - (item.expenditure || 0)), 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {items.filter(item => {
                if (viewMode === 'daily') return item.date === selectedDate.toISOString().split('T')[0];
                return item.date.slice(0, 7) === selectedDate.toISOString().slice(0, 7);
              }).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sales recorded for this period.
                  </div>
                )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MachinesModule;