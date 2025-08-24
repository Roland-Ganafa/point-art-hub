import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, Users, BarChart3, FileText, TrendingUp, Home, Sun, Moon } from "lucide-react";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/NotificationBell";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, profile, loading, signOut, isAdmin } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug: Log admin status for troubleshooting
  React.useEffect(() => {
    if (user && profile) {
      console.log('🔍 Admin Status Check:', {
        email: user.email,
        profileRole: profile.role,
        isAdmin: isAdmin,
        shouldShowAdmin: isAdmin || profile?.role === 'admin'
      });
    }
  }, [user, profile, isAdmin]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Logo />
        </div>
        
        {/* User Info Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div className="mb-2">
              <span className="block font-medium text-gray-900 dark:text-white">
                {profile?.full_name || user.email}
                {(isAdmin || profile?.role === 'admin') && (
                  <span className="ml-1 text-yellow-600 dark:text-yellow-400 font-semibold">(Admin)</span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile?.role && (
                <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {profile.role.toUpperCase()}
                </Badge>
              )}
              {profile?.sales_initials && (
                <Badge variant="outline" className="text-xs">
                  {profile.sales_initials}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button 
            variant="ghost" 
            onClick={toggleTheme}
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 mr-3" />
            ) : (
              <Sun className="w-4 h-4 mr-3" />
            )}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </Button>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {/* Home Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Home className="w-4 h-4 mr-3" />
              Home
            </Button>
            
            {/* Dashboard */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <BarChart3 className="w-4 h-4 mr-3" />
              Dashboard
            </Button>
            
            {/* Admin Panel - Always visible per project specification */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Admin Panel - Manage users and system settings"
            >
              <Shield className="w-4 h-4 mr-3" />
              Admin Panel
            </Button>
            
            {/* Customers */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/customers')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Users className="w-4 h-4 mr-3" />
              Customers
            </Button>
            
            {/* Reports */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/reports')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FileText className="w-4 h-4 mr-3" />
              Reports
            </Button>
            
            {/* Analytics */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/analytics')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Analytics
            </Button>
            
            {/* Invoices */}
            <Button 
              variant="ghost" 
              onClick={() => navigate('/invoices')}
              className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FileText className="w-4 h-4 mr-3" />
              Invoices
            </Button>
          </div>
        </nav>
        
        {/* Bottom Section with Notification */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Notification Bell */}
          <div className="flex justify-center">
            <NotificationBell />
          </div>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Point Art Hub</h1>
            
            {/* Top Right Navigation */}
            <div className="flex items-center gap-3">
              {/* Settings */}
              <Button 
                variant="outline" 
                onClick={() => navigate('/settings')}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              {/* Profile */}
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile')}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              
              {/* Sign Out Button */}
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;