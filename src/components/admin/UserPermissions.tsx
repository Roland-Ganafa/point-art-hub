import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { 
  Shield, 
  Users, 
  ShoppingCart, 
  Package, 
  Settings,
  Eye,
  Edit,
  Plus,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "@/utils/auditLogger";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const UserPermissions = () => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("user");
  const [permissions, setPermissions] = useState<Permission[]>([
    // User Management Permissions
    { id: "view_users", name: "View Users", description: "Can view user profiles and information", category: "User Management", enabled: true },
    { id: "create_users", name: "Create Users", description: "Can create new user accounts", category: "User Management", enabled: false },
    { id: "edit_users", name: "Edit Users", description: "Can edit user profiles and information", category: "User Management", enabled: false },
    { id: "delete_users", name: "Delete Users", description: "Can delete user accounts", category: "User Management", enabled: false },
    
    // Sales Permissions
    { id: "view_sales", name: "View Sales", description: "Can view sales records and reports", category: "Sales", enabled: true },
    { id: "create_sales", name: "Create Sales", description: "Can create new sales records", category: "Sales", enabled: true },
    { id: "edit_sales", name: "Edit Sales", description: "Can edit existing sales records", category: "Sales", enabled: true },
    { id: "delete_sales", name: "Delete Sales", description: "Can delete sales records", category: "Sales", enabled: false },
    
    // Inventory Permissions
    { id: "view_inventory", name: "View Inventory", description: "Can view inventory items and stock levels", category: "Inventory", enabled: true },
    { id: "create_inventory", name: "Create Inventory", description: "Can add new inventory items", category: "Inventory", enabled: false },
    { id: "edit_inventory", name: "Edit Inventory", description: "Can modify inventory items", category: "Inventory", enabled: false },
    { id: "delete_inventory", name: "Delete Inventory", description: "Can remove inventory items", category: "Inventory", enabled: false },
    
    // Reporting Permissions
    { id: "view_reports", name: "View Reports", description: "Can access and view reports", category: "Reporting", enabled: true },
    { id: "export_reports", name: "Export Reports", description: "Can export reports to CSV/Excel", category: "Reporting", enabled: false },
    { id: "schedule_reports", name: "Schedule Reports", description: "Can schedule automated reports", category: "Reporting", enabled: false },
    
    // System Permissions
    { id: "view_settings", name: "View Settings", description: "Can view system settings", category: "System", enabled: false },
    { id: "edit_settings", name: "Edit Settings", description: "Can modify system settings", category: "System", enabled: false },
    { id: "manage_backups", name: "Manage Backups", description: "Can create and restore backups", category: "System", enabled: false },
  ]);

  const roleTemplates: UserRole[] = [
    {
      id: "admin",
      name: "Administrator",
      description: "Full access to all system features",
      permissions: permissions.map(p => p.id)
    },
    {
      id: "manager",
      name: "Manager",
      description: "Access to sales, inventory, and reporting",
      permissions: [
        "view_users", "view_sales", "create_sales", "edit_sales", 
        "view_inventory", "create_inventory", "edit_inventory", 
        "view_reports", "export_reports"
      ]
    },
    {
      id: "sales",
      name: "Sales Representative",
      description: "Access to sales recording and basic reporting",
      permissions: [
        "view_sales", "create_sales", "edit_sales", 
        "view_inventory", "view_reports"
      ]
    },
    {
      id: "user",
      name: "Standard User",
      description: "Basic access to view data",
      permissions: [
        "view_sales", "view_inventory", "view_reports"
      ]
    }
  ];

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setPermissions(prev => 
      prev.map(p => 
        p.id === permissionId ? { ...p, enabled: checked } : p
      )
    );
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const role = roleTemplates.find(r => r.id === roleId);
    if (role) {
      setPermissions(prev => 
        prev.map(p => ({
          ...p,
          enabled: role.permissions.includes(p.id)
        }))
      );
    }
  };

  const handleSavePermissions = async () => {
    try {
      // In a real implementation, this would save to a permissions table
      // For now, we'll just show a success message
      toast({
        title: "Permissions Updated",
        description: `Permissions for ${roleTemplates.find(r => r.id === selectedRole)?.name} role have been updated.`,
      });
      
      // Log the action
      await logUserAction(
        null, // In a real implementation, this would be the current user
        "PERMISSIONS_UPDATED",
        {
          role: selectedRole,
          enabled_permissions: permissions.filter(p => p.enabled).map(p => p.id)
        }
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getPermissionIcon = (category: string) => {
    switch (category) {
      case "User Management": return <Users className="h-4 w-4" />;
      case "Sales": return <ShoppingCart className="h-4 w-4" />;
      case "Inventory": return <Package className="h-4 w-4" />;
      case "Reporting": return <Eye className="h-4 w-4" />;
      case "System": return <Settings className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Selection */}
          <div className="lg:col-span-1">
            <Label className="text-sm font-medium mb-2 block">Select Role</Label>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleTemplates.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Role Information</h4>
              <p className="text-sm text-blue-700">
                {roleTemplates.find(r => r.id === selectedRole)?.description}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                {permissions.filter(p => p.enabled).length} of {permissions.length} permissions enabled
              </p>
            </div>
          </div>
          
          {/* Permissions List */}
          <div className="lg:col-span-2">
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <AccordionItem value={category} key={category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(category)}
                      <span className="font-medium">{category}</span>
                      <span className="text-xs text-muted-foreground">
                        ({perms.filter(p => p.enabled).length}/{perms.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {perms.map(permission => (
                        <div key={permission.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={permission.id}
                            checked={permission.enabled}
                            onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                          />
                          <div className="grid gap-1.5">
                            <Label 
                              htmlFor={permission.id} 
                              className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="flex justify-end mt-6">
              <Button onClick={handleSavePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPermissions;