import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Lock, Scissors, TrendingUp, ShoppingCart, Star, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import ExportDialog from "@/components/ExportDialog";
import { Checkbox } from "@/components/ui/checkbox";
import CustomLoader from "@/components/ui/CustomLoader";
import { Database } from "@/integrations/supabase/types";

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface EmbroideryItem {
  id: string;
  job_description: string;
  quantity: number;
  rate: number;
  expenditure: number;
  done_by: string | null;
  date: string;
  created_at: string;
  quotation?: number;
  deposit?: number;
  client_name?: string | null;
  service_type?: string | null;
  status?: string | null;
  date_completed?: string | null;
  date_received?: string | null;
}
type ProfileItem = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "sales_initials" | "full_name">;

interface EmbroideryModuleProps { openAddTrigger?: number }
const EmbroideryModule = ({ openAddTrigger }: EmbroideryModuleProps) => {
  const [items, setItems] = useState<EmbroideryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastProcessedTrigger = useRef<number>(0);
  const [salesProfiles, setSalesProfiles] = useState<ProfileItem[]>([]);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    job_description: "",
    quantity: "1",
    rate: "",
    expenditure: "",
    done_by: "",
    service_type: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { isAdmin, profile } = useUser();

  // Define resetForm first before it's used in other callbacks
  const resetForm = useCallback(() => {
    setFormData({
      job_description: "",
      quantity: "1",
      rate: "",
      expenditure: "",
      done_by: "",
      service_type: ""
    });
    setEditingId(null);
    setFormErrors({});
  }, []);

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.job_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.done_by && item.done_by.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate totals
  const totalQuotation = filteredItems.reduce((sum, item) => sum + ((item.rate || 0) * item.quantity), 0);
  const totalExpenditure = filteredItems.reduce((sum, item) => sum + (item.expenditure || 0), 0);
  const totalProfit = totalQuotation - totalExpenditure;

  // Filter items based on selectedDate and viewMode for Daily Sales tab
  const filteredDailyItems = items.filter(item => {
    if (viewMode === 'daily') {
      return item.date === selectedDate.toISOString().split('T')[0];
    } else {
      return item.date.slice(0, 7) === selectedDate.toISOString().slice(0, 7);
    }
  });

  const dailyTotalSales = filteredDailyItems.reduce((sum, item) => sum + ((item.rate || 0) * item.quantity), 0);
  const dailyTotalExpenditure = filteredDailyItems.reduce((sum, item) => sum + (item.expenditure || 0), 0);
  const dailyTotalProfit = dailyTotalSales - dailyTotalExpenditure;

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

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("embroidery")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error fetching embroidery jobs",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setItems(data as unknown as EmbroideryItem[] || []);
      }
    } catch (error) {
      toast({
        title: "Error fetching embroidery jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.job_description.trim()) {
      errors.job_description = "Job description is required";
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      errors.rate = "Rate must be greater than 0";
    }

    if (!formData.expenditure || parseFloat(formData.expenditure) < 0) {
      errors.expenditure = "Expenditure must be 0 or greater";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEdit = (item: EmbroideryItem) => {
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
      job_description: item.job_description,
      quantity: item.quantity.toString(),
      rate: item.rate?.toString() || "",
      expenditure: item.expenditure.toString(),
      done_by: item.done_by || "",
      service_type: item.service_type || ""
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

    if (!confirm("Are you sure you want to delete this embroidery job?")) return;

    try {
      const { error } = await supabase
        .from("embroidery")
        .delete()
        .eq("id", id as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Embroidery job deleted successfully",
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error deleting job",
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
        .from("embroidery")
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
      setIsLoading(true);

      // Parse values safely - handle NaN values
      const quantity = parseInt(formData.quantity) || 1;
      const rate = parseFloat(formData.rate) || 0;
      const expenditure = parseFloat(formData.expenditure) || 0;
      const deposit = 0; // Default deposit value

      // Calculate derived values
      const quotation = quantity * rate;

      // Create job data object - Include required columns
      const jobData: any = {
        job_description: formData.job_description.trim(),
        quantity: quantity,
        rate: rate,
        expenditure: expenditure,
        deposit: deposit,
        quotation: quotation,
        done_by: formData.done_by === "not_specified" ? null : (formData.done_by || (profile?.id || null)),
        date: new Date().toISOString().split('T')[0],
        service_type: formData.service_type.trim() || null
      };

      console.log("Submitting embroidery job data:", jobData);

      if (editingId) {
        // Update existing job
        const { data, error } = await supabase
          .from("embroidery")
          .update(jobData)
          .eq("id", editingId)
          .select();

        if (error) {
          console.error("Supabase error during update:", error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Embroidery job updated successfully"
        });
      } else {
        // Create new job
        const { data, error } = await supabase
          .from("embroidery")
          .insert([jobData])
          .select();

        if (error) {
          console.error("Supabase error during insert:", error);
          throw error;
        }

        toast({
          title: "Success",
          description: "Embroidery job added successfully"
        });
      }

      // Close dialog, reset form and refresh data
      setIsDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      console.error("Error in embroidery job submission:", error);
      toast({
        title: editingId ? "Error updating job" : "Error adding job",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingId, validateForm, toast, resetForm, profile]);

  return (
    <div className="space-y-8 p-6">
      <Tabs defaultValue="inventory" className="space-y-8">
        <TabsList className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-1 shadow-lg">
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
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <Scissors className="h-8 w-8 text-purple-600" />
                Embroidery Services
              </h3>
              <p className="text-muted-foreground">Manage your embroidery jobs with detailed tracking</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-9 border-purple-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

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

              <ExportDialog
                data={items}
                type="embroidery"
                moduleTitle="Embroidery Services"
                disabled={items.length === 0}
              />

              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                if (open === false) {
                  resetForm();
                }
                setIsDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    onClick={() => {
                      resetForm();
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {editingId ? '✏️ Edit Embroidery Job' : '✨ Add New Embroidery Job'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Job Description *</Label>
                      <Textarea
                        value={formData.job_description}
                        onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                        required
                        className={`border-purple-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200 ${formErrors.job_description ? "border-red-500 focus:border-red-500" : ""}`}
                      />
                      {formErrors.job_description && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.job_description}</span>}
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
                          className="border-purple-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200"
                        />
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
                          className={`border-purple-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200 ${formErrors.rate ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.rate && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.rate}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Quotation (UGX) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.rate && formData.quantity ?
                            (parseFloat(formData.rate) * parseInt(formData.quantity)).toFixed(2) : "0"}
                          disabled
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Expenditure (UGX) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.expenditure}
                          onChange={(e) => setFormData({ ...formData, expenditure: e.target.value })}
                          required
                          className={`border-purple-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200 ${formErrors.expenditure ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.expenditure && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.expenditure}</span>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Profit (UGX)
                      </Label>
                      <Input
                        value={formData.rate && formData.quantity && formData.expenditure ?
                          (parseFloat(formData.rate) * parseInt(formData.quantity) - parseFloat(formData.expenditure)).toFixed(2) : "0"}
                        disabled
                        className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Service Type</Label>
                      <Input
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                        placeholder="e.g. Branding, T-Shirt"
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    </div>



                    <div className="space-y-2">
                      <Label>Done By (Initials)</Label>
                      <Select
                        value={formData.done_by}
                        onValueChange={(value) => setFormData({ ...formData, done_by: value })}
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
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <CustomLoader size="sm" className="mr-2" />
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {editingId ? '✏️ Update Job' : '✨ Add Job'}
                        </div>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-5 via-pink-5 to-rose-50 border-b border-purple-100">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
                  <Scissors className="h-6 w-6" />
                </div>
                Embroidery Jobs
                <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  {filteredItems.length} jobs
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                    <TableRow className="border-b border-purple-100">
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
                      <TableHead className="font-semibold text-gray-700 text-left">Job Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rate</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quotation</TableHead>
                      <TableHead className="font-semibold text-gray-700">Expenditure</TableHead>
                      <TableHead className="font-semibold text-gray-700">Profit</TableHead>
                      <TableHead className="font-semibold text-gray-700">Done by</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, index) => {
                        const quotation = (item.rate || 0) * item.quantity;
                        const profit = quotation - item.expenditure;
                        return (
                          <TableRow
                            key={item.id}
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 hover:from-purple-50 hover:to-pink-50`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {isAdmin && (
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(item.id)}
                                  onCheckedChange={() => toggleSelectOne(item.id)}
                                  aria-label={`Select ${item.job_description}`}
                                  className="translate-y-[2px]"
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium text-gray-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-semibold text-gray-800 max-w-xs truncate text-left">{item.job_description}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-blue-600">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="font-medium text-purple-600">{formatUGX(quotation)}</TableCell>
                            <TableCell className="font-medium text-red-600">{formatUGX(item.expenditure)}</TableCell>
                            <TableCell className={`font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              <div className="flex items-center gap-1">
                                <TrendingUp className={`h-4 w-4 ${profit >= 0 ? "text-green-500" : "text-red-500"}`} />
                                {formatUGX(profit)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {item.done_by ? salesProfiles.find(p => p.id === item.done_by)?.sales_initials || item.done_by : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-purple-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleEdit(item)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Admin access required" : "Edit job"}
                                >
                                  {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4 text-purple-600" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-100 hover:scale-110 transition-all duration-200"
                                  onClick={() => handleDelete(item.id)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? "Admin access required" : "Delete job"}
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
                        <TableCell colSpan={isAdmin ? 10 : 9} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {isLoading ? (
                              <div className="flex flex-col items-center gap-3">
                                <CustomLoader size="lg" />
                                <span className="text-lg text-gray-600 font-medium">Loading embroidery jobs...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <Scissors className="h-12 w-12 text-gray-400" />
                                <span className="text-lg text-gray-600">No embroidery jobs found.</span>
                                <span className="text-sm text-gray-500">Start by adding your first job!</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter className="bg-purple-50/50">
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 5 : 4} className="text-right font-bold text-gray-700">Totals</TableCell>
                      <TableCell className="font-bold text-purple-600">{formatUGX(totalQuotation)}</TableCell>
                      <TableCell className="font-bold text-red-600">{formatUGX(totalExpenditure)}</TableCell>
                      <TableCell className={`font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`h-4 w-4 ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`} />
                          {formatUGX(totalProfit)}
                        </div>
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-sales" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Sales Report - {viewMode === 'daily' ? selectedDate.toLocaleDateString() : selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>

              <div className="flex items-center gap-4 bg-white/50 p-1.5 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 bg-purple-50/50 rounded-md p-1">
                  <Button
                    variant={viewMode === 'daily' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('daily')}
                    className={`h-7 px-3 text-xs ${viewMode === 'daily' ? 'bg-white text-purple-600 shadow-sm border border-purple-100 hover:bg-white' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={viewMode === 'monthly' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('monthly')}
                    className={`h-7 px-3 text-xs ${viewMode === 'monthly' ? 'bg-white text-purple-600 shadow-sm border border-purple-100 hover:bg-white' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'}`}
                  >
                    Monthly
                  </Button>
                </div>

                <div className="h-4 w-px bg-purple-200 mx-1" />

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
                        if (viewMode === 'monthly') {
                          const [year, month] = e.target.value.split('-').map(Number);
                          setSelectedDate(new Date(year, month - 1, 1, 12, 0, 0));
                        } else {
                          setSelectedDate(new Date(e.target.value));
                        }
                      }
                    }}
                    className="h-7 w-[130px] text-xs border-0 bg-transparent focus:ring-0 cursor-pointer text-gray-600 font-medium"
                  />
                </div>
              </div>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-gray-50 to-purple-50">
                      <TableRow className="border-b border-purple-100">
                        <TableHead className="w-[50px] font-semibold text-gray-700 text-left">#</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-left">Job Description</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Total Sales (UGX)</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-right">Total Profit (UGX)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDailyItems.length > 0 ? (
                        filteredDailyItems.map((item, index) => {
                          const quotation = (item.rate || 0) * item.quantity;
                          const profit = quotation - item.expenditure;
                          return (
                            <TableRow key={item.id} className="hover:bg-purple-50/50 transition-colors">
                              <TableCell className="font-medium text-gray-500 text-left">{index + 1}</TableCell>
                              <TableCell className="font-medium text-gray-800 text-left">{item.job_description}</TableCell>
                              <TableCell className="text-right text-purple-600 font-medium">{formatUGX(quotation)}</TableCell>
                              <TableCell className={`text-right font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatUGX(profit)}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            No sales recorded for this period.
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Grand Totals */}
                      <TableRow className="bg-gradient-to-r from-purple-100 to-pink-100 font-bold border-t-2 border-purple-300">
                        <TableCell colSpan={2} className="text-gray-800">GRAND TOTAL</TableCell>
                        <TableCell className="text-right text-purple-800">
                          {formatUGX(dailyTotalSales)}
                        </TableCell>
                        <TableCell className="text-right text-green-800">
                          {formatUGX(dailyTotalProfit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div >
  );
};

export default EmbroideryModule;