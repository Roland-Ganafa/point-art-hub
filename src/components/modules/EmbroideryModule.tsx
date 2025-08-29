import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Lock, Scissors, TrendingUp, ShoppingCart, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import ExportDialog from "@/components/ExportDialog";

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface EmbroideryItem {
  id: string;
  job_description: string;
  quotation: number;
  balance: number;
  quantity: number;
  rate: number;
  expenditure: number;
  profit: number;
  sales: number;
  done_by: string | null;
  date: string;
}

interface EmbroideryModuleProps { openAddTrigger?: number }
const EmbroideryModule = ({ openAddTrigger }: EmbroideryModuleProps) => {
  const [items, setItems] = useState<EmbroideryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const lastProcessedTrigger = useRef<number>(0);
  const [salesProfiles, setSalesProfiles] = useState<Array<{id: string, sales_initials: string, full_name: string}>>([]);
  const [formData, setFormData] = useState({
    job_description: "",
    quotation: "",
    quantity: "1",
    rate: "",
    expenditure: "",
    sold_by: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { isAdmin, profile } = useUser();

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.job_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.done_by && item.done_by.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate profit when rate or quotation changes
  useEffect(() => {
    if (formData.rate && formData.quotation) {
      const rate = parseFloat(formData.rate) || 0;
      const quotation = parseFloat(formData.quotation) || 0;
      const profit = quotation - rate;
      setFormData(prev => ({
        ...prev,
        profit: profit.toFixed(2)
      }));
    }
  }, [formData.rate, formData.quotation]);

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
        setItems(data || []);
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

    if (!formData.quotation || parseFloat(formData.quotation) <= 0) {
      errors.quotation = "Quotation must be greater than 0";
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
      quotation: item.quotation.toString(),
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      expenditure: item.expenditure.toString(),
      sold_by: item.done_by || ""
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
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Embroidery job deleted successfully",
      });

      fetchItems();
    } catch (error) {
      toast({
        title: "Error deleting job",
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

    try {
      const jobData = {
        job_description: formData.job_description,
        quotation: parseFloat(formData.quotation),
        quantity: parseInt(formData.quantity || "1"),
        rate: parseFloat(formData.rate || "0"),
        expenditure: parseFloat(formData.expenditure),
        done_by: formData.sold_by || profile?.id || null
      };

      if (editingId) {
        // Update existing job
        const { error } = await supabase
          .from("embroidery")
          .update(jobData)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Embroidery job updated successfully",
        });
      } else {
        // Create new job
        const { error } = await supabase
          .from("embroidery")
          .insert([jobData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Embroidery job added successfully",
        });
      }

      setIsDialogOpen(false);
      setFormData({
        job_description: "",
        quotation: "",
        quantity: "1",
        rate: "",
        expenditure: "",
        sold_by: ""
      });
      setEditingId(null);
      setFormErrors({});
      fetchItems();
    } catch (error) {
      toast({
        title: editingId ? "Error updating job" : "Error adding job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      job_description: "",
      quotation: "",
      quantity: "1",
      rate: "",
      expenditure: "",
      sold_by: ""
    });
    setEditingId(null);
    setFormErrors({});
  };

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
              
              <ExportDialog
                data={items}
                type="embroidery"
                moduleTitle="Embroidery Services"
                disabled={items.length === 0}
              />
              
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={resetForm}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                          value={formData.quotation}
                          onChange={(e) => setFormData({ ...formData, quotation: e.target.value })}
                          required
                          className={`border-purple-200 focus:border-purple-400 focus:ring-purple-200 transition-all duration-200 ${formErrors.quotation ? "border-red-500 focus:border-red-500" : ""}`}
                        />
                        {formErrors.quotation && <span className="text-red-500 text-sm flex items-center gap-1"><Search className="h-3 w-3" />{formErrors.quotation}</span>}
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          Profit (UGX)
                        </Label>
                        <Input
                          value={formData.quotation && formData.rate ? 
                            (parseFloat(formData.quotation) - parseFloat(formData.rate)).toFixed(2) : "0"}
                          disabled
                          className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 font-medium"
                        />
                      </div>
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
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-b border-purple-100">
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
                      <TableHead className="font-semibold text-gray-700">Job Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quantity</TableHead>
                      <TableHead className="font-semibold text-gray-700">Rate (UGX)</TableHead>
                      <TableHead className="font-semibold text-gray-700">Quotation</TableHead>
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
                        const profit = item.quotation - item.rate;
                        return (
                          <TableRow 
                            key={item.id} 
                            className={`group hover:bg-gradient-to-r transition-all duration-300 animate-in slide-in-from-left-4 hover:from-purple-50 hover:to-pink-50`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="font-semibold text-gray-800 max-w-xs truncate">{item.job_description}</TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium text-blue-600">{formatUGX(item.rate)}</TableCell>
                            <TableCell className="font-medium text-purple-600">{formatUGX(item.quotation)}</TableCell>
                            <TableCell className="font-medium text-red-600">{formatUGX(item.expenditure)}</TableCell>
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
                        <TableCell colSpan={9} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-4">
                            {isLoading ? (
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-lg text-gray-600">Loading embroidery jobs...</span>
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
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily-sales" className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden p-6">
            <h3 className="text-xl font-bold mb-4">Daily Sales Report</h3>
            <p className="text-muted-foreground">Daily sales tracking for embroidery services will be implemented here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmbroideryModule;