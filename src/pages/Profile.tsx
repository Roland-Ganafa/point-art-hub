import React, { useState } from 'react';
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
  Save
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { user, profile, loading, isAdmin, refreshProfile } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: profile?.full_name || '',
    sales_initials: profile?.sales_initials || ''
  });

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
          full_name: editForm.full_name,
          sales_initials: editForm.sales_initials
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

  // Update form when profile data changes
  React.useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        sales_initials: profile.sales_initials || ''
      });
    }
  }, [profile]);

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
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center">
                <span className="text-2xl font-semibold">{getInitials(profile?.full_name)}</span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getRoleColor(profile?.role)} text-white rounded-full flex items-center justify-center shadow-md`}>
                {profile?.role === 'admin' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {profile?.full_name || 'User Profile'}
              </h1>
              <p className="text-gray-600 mb-3">{user?.email}</p>
              <div className="flex items-center space-x-3">
                {profile?.role && (
                  <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="text-xs px-3 py-1">
                    {profile.role.toUpperCase()}
                  </Badge>
                )}
                {profile?.sales_initials && (
                  <Badge variant="outline" className="text-xs px-3 py-1">
                    ID: {profile.sales_initials}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs px-3 py-1">
                  Since {profile?.created_at ? new Date(profile.created_at).getFullYear() : 'Unknown'}
                </Badge>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="px-6"
                    onClick={() => {
                      setEditForm({
                        full_name: profile?.full_name || '',
                        sales_initials: profile?.sales_initials || ''
                      });
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5 text-blue-600" />
                      Edit Profile Information
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sales_initials">Sales Initials</Label>
                      <Input
                        id="sales_initials"
                        value={editForm.sales_initials}
                        onChange={(e) => setEditForm(prev => ({ ...prev, sales_initials: e.target.value }))}
                        placeholder="Enter your sales initials"
                        maxLength={10}
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={handleEditProfile}
                        disabled={isUpdating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                        onClick={() => setIsEditDialogOpen(false)}
                        disabled={isUpdating}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button className="px-6 bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
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
                  <User className="h-5 w-5 mr-3 text-blue-600" />
                  Personal Information
                </CardTitle>
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
                    <label className="text-sm font-medium text-gray-700">User ID</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md font-mono text-sm">{user?.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Details Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <Shield className="h-5 w-5 mr-3 text-blue-600" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Account Role</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md flex-1">{profile?.role || 'Not assigned'}</p>
                      <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                        {profile?.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Account Status</label>
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-900">Active</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Join Date</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formatDate(profile?.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Last Sign In</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formatDate(user?.last_sign_in_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <Activity className="h-5 w-5 mr-3 text-blue-600" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email Verified</label>
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md">
                      <div className={`w-2 h-2 rounded-full ${user?.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-gray-900">{user?.email_confirmed_at ? 'Verified' : 'Pending'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Profile Updated</label>
                    <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{formatDate(profile?.updated_at)}</p>
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
                  <Star className="h-5 w-5 mr-3 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    setEditForm({
                      full_name: profile?.full_name || '',
                      sales_initials: profile?.sales_initials || ''
                    });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
                <Button variant="outline" className="w-full" onClick={handleBackToMain}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Account Summary Card */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <UserCheck className="h-5 w-5 mr-3 text-blue-600" />
                  Account Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Profile Completion</span>
                    <span className="text-sm font-medium text-gray-900">85%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Security Level</span>
                    <Badge variant="outline" className="text-xs">
                      {user?.email_confirmed_at ? 'High' : 'Medium'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Account Type</span>
                    <span className="text-sm font-medium text-gray-900">Standard</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Active Since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;