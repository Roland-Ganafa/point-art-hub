import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Lock } from "lucide-react";
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
  deposit: number;
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
  const lastProcessedTrigger = useRef<number>(0);
  const [formData, setFormData] = useState({
    job_description: "",
    quotation: "",
    deposit: "",
    quantity: "1",
    rate: "",
    expenditure: "",
  });
  const { toast } = useToast();
  const { isAdmin } = useUser();

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.job_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }, []);

  const fetchItems = async () => {
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
      deposit: item.deposit.toString(),
      quantity: item.quantity.toString(),
      rate: item.rate.toString(),
      expenditure: item.expenditure.toString(),
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

    try {
      const jobData = {
        job_description: formData.job_description,
        quotation: parseFloat(formData.quotation),
        deposit: parseFloat(formData.deposit || "0"),
        quantity: parseInt(formData.quantity || "1"),
        rate: parseFloat(formData.rate || "0"),
        expenditure: parseFloat(formData.expenditure),
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
        const { error } = await supabase.from("embroidery").insert([jobData]);

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
        deposit: "",
        quantity: "1",
        rate: "",
        expenditure: "",
      });
      setEditingId(null);
      fetchItems();
    } catch (error) {
      toast({
        title: editingId ? "Error updating job" : "Error adding job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Embroidery Services</h3>
          <p className="text-gray-600 mt-1">Manage your embroidery jobs and services</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
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
            if (!open) {
              setEditingId(null);
              setFormData({
                job_description: "",
                quotation: "",
                deposit: "",
                quantity: "1",
                rate: "",
                expenditure: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Embroidery Job" : "Add Embroidery Job"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="job_description">Job Description</Label>
                <Textarea
                  id="job_description"
                  value={formData.job_description}
                  onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                  required
                />
              </div>
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
                  <Label htmlFor="quotation">Quotation (UGX)</Label>
                  <Input
                    id="quotation"
                    type="number"
                    step="0.01"
                    value={formData.quotation}
                    onChange={(e) => setFormData({ ...formData, quotation: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deposit">Deposit (UGX)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    step="0.01"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expenditure">Expenditure (UGX)</Label>
                <Input
                  id="expenditure"
                  type="number"
                  step="0.01"
                  value={formData.expenditure}
                  onChange={(e) => setFormData({ ...formData, expenditure: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">{editingId ? "Update Job" : "Add Job"}</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Embroidery Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Rate (UGX)</TableHead>
                <TableHead>Quotation (UGX)</TableHead>
                <TableHead>Deposit (UGX)</TableHead>
                <TableHead>Balance (UGX)</TableHead>
                <TableHead>Expenditure (UGX)</TableHead>
                <TableHead>Profit (UGX)</TableHead>
                <TableHead>Sales (UGX)</TableHead>
                <TableHead>Sales By</TableHead>
                <TableHead>Date of Service</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-xs truncate">{item.job_description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatUGX(item.rate)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatUGX(item.quotation)}</TableCell>
                    <TableCell>{formatUGX(item.deposit)}</TableCell>
                    <TableCell>{formatUGX(item.balance)}</TableCell>
                    <TableCell>{formatUGX(item.expenditure)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatUGX(item.profit)}</TableCell>
                    <TableCell className="font-semibold">{formatUGX(item.sales)}</TableCell>
                    <TableCell>{item.done_by || "-"}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(item)}
                          disabled={!isAdmin}
                          title={!isAdmin ? "Admin access required" : "Edit job"}
                        >
                          {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          disabled={!isAdmin}
                          title={!isAdmin ? "Admin access required" : "Delete job"}
                        >
                          {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    {searchTerm ? "No jobs match your search." : "No embroidery jobs found. Add your first job above."}
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

export default EmbroideryModule;