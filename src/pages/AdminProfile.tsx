import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Hash,
  Edit,
  Settings,
  Activity,
  UserCheck,
  Star,
  ArrowLeft,
  Save,
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: 'admin' | 'user' | null;
  sales_initials: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const AdminProfilePage = () => {
  const { user, profile, loading, isAdmin, refreshProfile } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUserEditDialogOpen, setIsUserEditDialogOpen] = useState(false);
  const [userEditForm, setUserEditForm] = useState({
    full_name: '',
    role: 'user' as 'admin' | 'user',
    sales_initials: ''
  });
  const [redirectChecked, setRedirectChecked] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'user',
    sales_initials: ''
  });

  // Load all users for admin management
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
  }, [isAdmin]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.sales_initials?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  // Handle redirect for non-admin users with a delay to allow profile to load
  useEffect(() => {
    if (!loading && !isAdmin && profile !== undefined) {
      // Add a small delay to ensure profile is fully loaded
      const timer = setTimeout(() => {
        setRedirectChecked(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, isAdmin, profile]);

  // Redirect non-admin users after check
  useEffect(() => {
    if (redirectChecked && !isAdmin) {
      console.log('Redirecting non-admin user to profile page');
      navigate('/profile');
    }
  }, [redirectChecked, isAdmin, navigate]);

  const loadAllUsers = async () => {
    if (!isAdmin) return;

    setIsUsersLoading(true);
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setUsers(profiles);
      setFilteredUsers(profiles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error Loading Users",
        description: "There was an error loading the user list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUsersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  // Show loading state while checking redirect
  if (!redirectChecked && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg text-gray-600">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  // Log admin status for debugging
  console.log('AdminProfilePage - isAdmin:', isAdmin);
  console.log('AdminProfilePage - profile:', profile);
  console.log('AdminProfilePage - user:', user);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleEditProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile?.full_name || '',
          sales_initials: profile?.sales_initials || ''
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the profile data from UserContext
      await refreshProfile();

      toast({
        title: "Profile Updated Successfully!",
        description: "Your profile information has been saved.",
        duration: 5000,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditUser = async (userId: string) => {
    if (!userId) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userEditForm.full_name,
          role: userEditForm.role,
          sales_initials: userEditForm.sales_initials
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the user list
      await loadAllUsers();

      toast({
        title: "User Updated Successfully!",
        description: "The user information has been saved.",
        duration: 5000,
      });

      setIsUserEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('User update error:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the user. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the user list
      await loadAllUsers();

      toast({
        title: "Admin Role Assigned!",
        description: "The user has been granted admin privileges.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Make admin error:', error);
      toast({
        title: "Failed to Assign Admin Role",
        description: "There was an error assigning admin privileges. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh the user list
      await loadAllUsers();

      toast({
        title: "Admin Role Removed!",
        description: "The user's admin privileges have been revoked.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Remove admin error:', error);
      toast({
        title: "Failed to Remove Admin Role",
        description: "There was an error removing admin privileges. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleCreateUser = async () => {
    // Debug: Check which project we are connecting to
    const currentUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!addUserForm.email || !addUserForm.password) {
      alert("Please enter both email and password.");
      return;
    }

    setIsUpdating(true);
    try {
      console.log("Creating user via RPC...");

      const { data: userId, error } = await supabase.rpc('admin_create_user', {
        new_email: addUserForm.email,
        new_password: addUserForm.password,
        new_full_name: addUserForm.full_name,
        new_role: addUserForm.role,
        new_sales_initials: addUserForm.sales_initials
      });

      if (error) {
        console.error("RPC Error:", error);
        alert(`Failed to create user: ${error.message}`);
        throw error;
      }

      console.log("User created successfully via RPC:", userId);

      alert("User created successfully! The list will refresh now.");

      toast({
        title: "User Created Successfully",
        description: "User has been created and verified immediately.",
        duration: 5000,
      });

      setAddUserForm({
        email: '',
        password: '',
        full_name: '',
        role: 'user',
        sales_initials: ''
      });
      setIsAddUserDialogOpen(false);

      // Slight delay before reload to ensure DB consistency
      setTimeout(() => loadAllUsers(), 500);
      await loadAllUsers();

    } catch (error: any) {
      console.error("Create user error:", error);
      toast({
        title: "Failed to Create User",
        description: error.message || "An error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleColor = (role: string | null | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'user': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center space-x-6">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={handleBackToMain}
              className="px-4 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-lg flex items-center justify-center">
                <span className="text-2xl font-semibold">{getInitials(profile?.full_name)}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getRoleColor(profile?.role)} text-white rounded-full flex items-center justify-center shadow-md`}>
                <Shield className="h-3 w-3" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1 flex items-center">
                {profile?.full_name || 'Admin Profile'}
                <Badge variant="default" className="ml-3 bg-red-500">
                  ADMIN
                </Badge>
              </h1>
              <p className="text-gray-600 mb-3">{user?.email}</p>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs px-3 py-1">
                  ID: {profile?.sales_initials || 'Not assigned'}
                </Badge>
                <Badge variant="outline" className="text-xs px-3 py-1">
                  Since {profile?.created_at ? new Date(profile.created_at).getFullYear() : 'Unknown'}
                </Badge>
                <Badge variant="outline" className="text-xs px-3 py-1">
                  {users.length} Users Managed
                </Badge>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button className="px-6 bg-red-600 hover:bg-red-700" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <User className="h-5 w-5 mr-3 text-red-600" />
                  Admin Information
                </CardTitle>
                <CardDescription>
                  Your personal information and admin privileges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{profile?.full_name || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Sales Initials</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{profile?.sales_initials || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Admin ID</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">{user?.id}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    variant="outline"
                    className="px-6 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      // Open edit dialog
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Admin Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Management Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <Users className="h-5 w-5 mr-3 text-red-600" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage all users in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="px-4">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button
                    className="px-4 bg-red-600 hover:bg-red-700"
                    onClick={() => setIsAddUserDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>

                {/* Users List */}
                {isUsersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-600">Loading users...</span>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Initials
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'Unnamed User'}</div>
                                    <div className="text-sm text-gray-500">User ID: {user.user_id.substring(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-red-500' : ''}>
                                  {user.role?.toUpperCase() || 'UNASSIGNED'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.sales_initials || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  {user.role !== 'admin' ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-2 py-1 h-8"
                                      onClick={() => handleMakeAdmin(user.user_id)}
                                    >
                                      Make Admin
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs px-2 py-1 h-8 border-red-200 text-red-700 hover:bg-red-50"
                                      onClick={() => handleRemoveAdmin(user.user_id)}
                                    >
                                      Remove Admin
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs px-2 py-1 h-8"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setUserEditForm({
                                        full_name: user.full_name || '',
                                        role: user.role || 'user',
                                        sales_initials: user.sales_initials || ''
                                      });
                                      setIsUserEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Information Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <Activity className="h-5 w-5 mr-3 text-red-600" />
                  System Information
                </CardTitle>
                <CardDescription>
                  System status and admin activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Account Status</label>
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-900">Active</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Admin Since</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formatDate(profile?.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email Verified</label>
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md">
                      <div className={`w-2 h-2 rounded-full ${user?.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-gray-900">{user?.email_confirmed_at ? 'Verified' : 'Pending'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Last Sign In</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formatDate(user?.last_sign_in_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <Star className="h-5 w-5 mr-3 text-red-600" />
                  Admin Actions
                </CardTitle>
                <CardDescription>
                  Quick administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
                <Button variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  View Audit Logs
                </Button>
                <Button variant="outline" className="w-full" onClick={handleBackToMain}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <Shield className="h-5 w-5 mr-3 text-red-600" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Current system health
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">System Status</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Database</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Authentication</span>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Admins Online</span>
                    <span className="text-sm font-medium text-gray-900">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Tips Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <AlertTriangle className="h-5 w-5 mr-3 text-red-600" />
                  Admin Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Only admins can manage users and system settings</p>
                  <p>• Use emergency admin access if locked out</p>
                  <p>• Regular backups are recommended</p>
                  <p>• Monitor audit logs for security</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-red-600" />
              Add New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new_email">Email Address</Label>
              <Input
                id="new_email"
                type="email"
                value={addUserForm.email}
                onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Password</Label>
              <Input
                id="new_password"
                type="password"
                value={addUserForm.password}
                onChange={(e) => setAddUserForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_full_name">Full Name</Label>
              <Input
                id="new_full_name"
                value={addUserForm.full_name}
                onChange={(e) => setAddUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_role">Role</Label>
              <select
                id="new_role"
                value={addUserForm.role}
                onChange={(e) => setAddUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_sales_initials">Sales Initials</Label>
              <Input
                id="new_sales_initials"
                value={addUserForm.sales_initials}
                onChange={(e) => setAddUserForm(prev => ({ ...prev, sales_initials: e.target.value }))}
                placeholder="Enter sales initials"
                maxLength={10}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleCreateUser}
                disabled={isUpdating}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create User
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddUserDialogOpen(false)}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={isUserEditDialogOpen} onOpenChange={setIsUserEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-red-600" />
              Edit User Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="user_full_name">Full Name</Label>
              <Input
                id="user_full_name"
                value={userEditForm.full_name}
                onChange={(e) => setUserEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_role">Role</Label>
              <select
                id="user_role"
                value={userEditForm.role}
                onChange={(e) => setUserEditForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user_sales_initials">Sales Initials</Label>
              <Input
                id="user_sales_initials"
                value={userEditForm.sales_initials}
                onChange={(e) => setUserEditForm(prev => ({ ...prev, sales_initials: e.target.value }))}
                placeholder="Enter sales initials"
                maxLength={10}
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={() => selectedUser && handleEditUser(selectedUser.user_id)}
                disabled={isUpdating}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsUserEditDialogOpen(false)}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfilePage;