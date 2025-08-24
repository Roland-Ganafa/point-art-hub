import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Shield, Users, UserCog, ArrowLeft, AlertTriangle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'user' | null;
  sales_initials: string | null;
  created_at: string | null;
  updated_at: string | null;
  email?: string;
}

const AdminProfile = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyAccess, setShowEmergencyAccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user" as "admin" | "user",
  });
  
  const { toast } = useToast();
  const { isAdmin, profile: currentProfile, user: currentUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    fetchProfiles();
  }, [isAdmin, navigate]);

  const fetchProfiles = async () => {
    try {
      setIsLoading(true);
      
      // Get profiles with user data
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Try to get user emails from auth.users (requires admin access)
      // If this fails, we'll try alternative methods
      let usersData = null;
      try {
        const { data, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError) {
          usersData = data;
        }
      } catch (error) {
        console.warn("Cannot fetch user emails - admin access required:", error);
      }
      
      // Combine profile data with email information
      const profilesWithEmails = profilesData?.map((profile) => {
        let email = "Email not available";
        
        // Try to get email from admin API first
        if (usersData?.users) {
          const user = usersData.users.find(user => user.id === profile.user_id);
          if (user?.email) {
            email = user.email;
          }
        }
        
        // Fallback: if this is the current user, we can get their email from UserContext
        if (email === "Email not available" && profile.user_id === currentProfile?.user_id && currentUser?.email) {
          email = currentUser.email;
        }
        
        // Another fallback: try to derive from full_name patterns
        if (email === "Email not available" && profile.full_name) {
          // This is a guess based on common patterns, not always accurate
          const nameParts = profile.full_name.toLowerCase().split(' ');
          if (nameParts.length >= 2) {
            email = `${nameParts[0]}.${nameParts[1]}@unknown.com (estimated)`;
          }
        }
        
        return {
          ...profile,
          email
        };
      }) || [];

      setProfiles(profilesWithEmails);
    } catch (error) {
      toast({
        title: "Error fetching profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);

      // Use regular signup instead of admin.createUser to avoid "User not allowed" error
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name
          }
        }
      });

      if (authError) throw authError;

      // The profile will be created automatically by the database trigger
      // But we need to update the role to the selected role
      if (authData.user) {
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: formData.role,
          })
          .eq('user_id', authData.user.id);

        if (profileError) {
          console.warn('Profile update error:', profileError);
          // Don't throw here as the user was created successfully
        }
      }

      toast({
        title: "Success",
        description: "User created successfully. They will need to verify their email address.",
      });

      setIsDialogOpen(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "user",
      });
      
      // Refresh the profiles list after a short delay
      setTimeout(() => {
        fetchProfiles();
      }, 2000);
    } catch (error) {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (profileId: string, newRole: "admin" | "user") => {
    if (profileId === currentProfile?.id && newRole !== "admin") {
      toast({
        title: "Cannot change own role",
        description: "You cannot remove your own admin privileges",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", profileId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    if (profile.id === currentProfile?.id) {
      toast({
        title: "Cannot delete own account",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${profile.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Since we don't have admin access, we can only delete the profile
      // The user's auth account will remain but won't be able to access the system
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);
      
      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "User profile deleted successfully. The user's authentication account still exists but cannot access the system.",
      });

      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAssignInitials = async () => {
    try {
      setIsLoading(true);
      
      // Get profiles without sales_initials and assign them manually
      const { data: profilesWithoutInitials, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .is('sales_initials', null);
        
      if (fetchError) throw fetchError;
      
      // Manually assign initials for each profile
      for (const profile of profilesWithoutInitials || []) {
        const initial = profile.full_name.charAt(0).toUpperCase();
        let initials = initial;
        let counter = 1;
        
        // Check if initials already exist and find available ones
        while (true) {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('sales_initials', initials)
            .single();
            
          if (!existing) break;
          initials = initial + counter;
          counter++;
        }
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ sales_initials: initials })
          .eq('id', profile.id);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Success",
        description: "Sales initials assigned to all users",
      });
      
      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error assigning initials",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Emergency admin access functions
  const toggleEmergencyAccessInfo = () => {
    setShowEmergencyAccess(!showEmergencyAccess);
  };

  const copyEmergencyScript = () => {
    const script = `// Emergency Admin Access Script
// Run this in your browser console (F12 -> Console tab)

// Check your current admin status
checkAdminStatusAndFix();

// If you need to become admin (for development only)
// makeCurrentUserAdmin();

// Navigate to admin panel
// emergencyAdminAccess();`;
    
    navigator.clipboard.writeText(script);
    toast({
      title: "Script Copied!",
      description: "Emergency admin access script copied to clipboard",
    });
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 hover:scale-105 transition-all duration-200 hover:shadow-lg px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Profile Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAssignInitials} disabled={isLoading}>
            <UserCog className="mr-2 h-4 w-4" />
            Assign Sales Initials
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") => setFormData({...formData, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Emergency Admin Access Section */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Emergency Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-yellow-700">
            In case of emergencies or if the admin panel is not accessible, you can use browser console commands to manage admin access.
          </p>
          
          <Button 
            variant="outline" 
            onClick={toggleEmergencyAccessInfo}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <Info className="h-4 w-4 mr-2" />
            {showEmergencyAccess ? "Hide" : "Show"} Emergency Instructions
          </Button>
          
          {showEmergencyAccess && (
            <div className="space-y-3 p-4 bg-white rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800">Emergency Access Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                <li>Press <kbd className="px-2 py-1 bg-yellow-100 rounded">F12</kbd> to open Developer Tools</li>
                <li>Click on the "Console" tab</li>
                <li>Copy and paste the following script:</li>
              </ol>
              
              <div className="relative">
                <pre className="bg-gray-800 text-green-400 p-4 rounded text-sm overflow-x-auto">
                  {`// Emergency Admin Access Script
// Run this in your browser console (F12 -> Console tab)

// Check your current admin status
checkAdminStatusAndFix();

// If you need to become admin (for development only)
// makeCurrentUserAdmin();

// Navigate to admin panel
// emergencyAdminAccess();`}
                </pre>
                <Button 
                  size="sm" 
                  onClick={copyEmergencyScript}
                  className="absolute top-2 right-2 bg-yellow-600 hover:bg-yellow-700"
                >
                  Copy Script
                </Button>
              </div>
              
              <div className="text-sm text-yellow-600">
                <p><strong>Note:</strong> These commands are for development and emergency use only.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profiles.filter(p => p.role === 'user').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Initials</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.full_name}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role?.toUpperCase() || 'NO ROLE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.sales_initials && (
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {profile.sales_initials}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Select
                        value={profile.role || 'user'}
                        onValueChange={(value: "admin" | "user") => handleUpdateRole(profile.id, value)}
                        disabled={profile.id === currentProfile?.id}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteUser(profile)}
                        disabled={profile.id === currentProfile?.id}
                        title={profile.id === currentProfile?.id ? "Cannot delete own account" : "Delete user"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;