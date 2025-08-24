import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import ExportDialog from "@/components/ExportDialog";

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
  expenditure: number;
  sales: number;
  done_by: string | null;
  date: string;
}


interface MachinesModuleProps { openAddTrigger?: number }
const MachinesModule = ({ openAddTrigger }: MachinesModuleProps) => {
  const [items, setItems] = useState<MachineService[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const lastProcessedTrigger = useRef<number>(0);
  const [formData, setFormData] = useState({
    machine_name: "printer",
    service_description: "",
    quantity: "",
    rate: "",
    expenditure: "",
  });
  const { toast } = useToast();
  const { isAdmin } = useUser();

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
  }, []);

  const fetchItems = async () => {
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
      setItems(data || []);
    }
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
      expenditure: item.expenditure.toString(),
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

    const serviceData = {
      machine_name: formData.machine_name as "printer" | "copier" | "scanner" | "binder" | "laminator",
      service_description: formData.service_description,
      quantity: parseInt(formData.quantity),
      rate: parseFloat(formData.rate),
      expenditure: parseFloat(formData.expenditure || "0"),
    };

    try {
      let error;
      
      if (editingId) {
        // Update existing service
        const result = await supabase
          .from("machines")
          .update(serviceData)
          .eq("id", editingId);
        error = result.error;
      } else {
        // Create new service
        const result = await supabase.from("machines").insert([serviceData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingId ? "Machine service updated successfully" : "Machine service added successfully",
      });
      
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({
        machine_name: "printer",
        service_description: "",
        quantity: "",
        rate: "",
        expenditure: "",
      });
      fetchItems();
    } catch (error) {
      toast({
        title: editingId ? "Error updating service" : "Error adding service",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Machine Services</h3>
          <p className="text-gray-600 mt-1">Manage your printing and machine services</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-9 border-orange-200 focus:border-orange-400 focus:ring-orange-200 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <ExportDialog
            data={items}
            type="machines"
            moduleTitle="Machine Services"
            disabled={items.length === 0}
          />
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({
                machine_name: "printer",
                service_description: "",
                quantity: "",
                rate: "",
                expenditure: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Machine Service" : "Add Machine Service"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="machine_name">Machine Type</Label>
                <Select value={formData.machine_name} onValueChange={(value) => setFormData({ ...formData, machine_name: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <Label htmlFor="service_description">Service Description</Label>
                <Textarea
                  id="service_description"
                  value={formData.service_description}
                  onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
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
              <div>
                <Label htmlFor="expenditure">Expenditure (UGX)</Label>
                <Input
                  id="expenditure"
                  type="number"
                  step="0.01"
                  value={formData.expenditure}
                  onChange={(e) => setFormData({ ...formData, expenditure: e.target.value })}
                  placeholder="0"
                />
              </div>
              <Button type="submit" className="w-full">{editingId ? "Update Service" : "Add Service"}</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>Service Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Rate (UGX)</TableHead>
                <TableHead>Expenditure (UGX)</TableHead>
                <TableHead>Sales (UGX)</TableHead>
                <TableHead>Sales By</TableHead>
                <TableHead>Date of Service</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium capitalize">{item.machine_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.service_description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatUGX(item.rate)}</TableCell>
                    <TableCell>{formatUGX(item.expenditure)}</TableCell>
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
                          title={!isAdmin ? "Admin access required" : "Edit service"}
                        >
                          {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Edit className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(item.id)}
                          disabled={!isAdmin}
                          title={!isAdmin ? "Admin access required" : "Delete service"}
                        >
                          {!isAdmin ? <Lock className="h-4 w-4 text-gray-400" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    {searchTerm ? "No services match your search." : "No machine services found. Add your first service above."}
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

export default MachinesModule;