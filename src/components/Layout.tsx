import React, { useState, useEffect } from "react";
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
  const { user, profile, loading, signOut, isAdmin, authError } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

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

  // Handle redirect for non-authenticated users
  const shouldRedirect = !user && !loading;

  React.useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        navigate('/auth');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Display auth errors if any
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-500 mb-4">Authentication Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{authError}</p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/bypass-auth')}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 font-semibold"
            >
              Enter Development Mode
            </Button>
            <Button
              onClick={() => navigate('/direct-login')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-all duration-300 text-white font-medium shadow-md hover:shadow-lg"
            >
              Use Fast Login
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Go to Login
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Show redirect message while navigation happens
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-lg mb-4">Redirecting to login...</div>
        <div className="flex space-x-4">
          <Button
            onClick={() => navigate('/bypass-auth')}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 font-semibold"
          >
            Enter Development Mode
          </Button>
        </div>
        <div className="flex space-x-4 mt-4">
          <Button
            onClick={() => {
              if (redirectTimer) window.clearTimeout(redirectTimer);
              window.location.href = '/auth';
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Standard Login
          </Button>
          <Button
            onClick={() => {
              if (redirectTimer) window.clearTimeout(redirectTimer);
              window.location.href = '/direct-login';
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 transition-all duration-300 text-white font-medium shadow-md hover:shadow-lg"
          >
            Fast Login
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500 max-w-md text-center">
          If you're experiencing connection timeouts, try the Fast Login option which bypasses session checks.
        </p>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-card border-r border-border flex flex-col transition-colors duration-200">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <Logo />
        </div>

        {/* User Info Section */}
        <div className="p-4 border-b border-border">
          <div className="text-sm text-muted-foreground">
            <div className="mb-2">
              <span className="block font-medium text-foreground">
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
        <div className="p-4 border-b border-border">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
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
              className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Home className="w-4 h-4 mr-3" />
              Home
            </Button>

            {/* Dashboard - Hide for regular users */}
            {(isAdmin || profile?.role === 'admin') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <BarChart3 className="w-4 h-4 mr-3" />
                Dashboard
              </Button>
            )}

            {/* Admin Panel - Only visible to admins */}
            {(isAdmin || profile?.role === 'admin') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
                title="Admin Panel - Manage users and system settings"
              >
                <Shield className="w-4 h-4 mr-3" />
                Admin Panel
              </Button>
            )}

            {/* Customers - Only visible to admins */}
            {(isAdmin || profile?.role === 'admin') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/customers')}
                className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Users className="w-4 h-4 mr-3" />
                Customers
              </Button>
            )}

            {/* Reports - Only visible to admins */}
            {(isAdmin || profile?.role === 'admin') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/reports')}
                className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="w-4 h-4 mr-3" />
                Reports
              </Button>
            )}

            {/* Analytics - Only visible to admins */}
            {(isAdmin || profile?.role === 'admin') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/analytics')}
                className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <TrendingUp className="w-4 h-4 mr-3" />
                Analytics
              </Button>
            )}

            {/* Invoices - Only visible to admins */}
            {(isAdmin || profile?.role === 'admin') && (
              <Button
                variant="ghost"
                onClick={() => navigate('/invoices')}
                className="w-full justify-start text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="w-4 h-4 mr-3" />
                Invoices
              </Button>
            )}
          </div>
        </nav>

        {/* Bottom Section with Notification */}
        <div className="p-4 border-t border-border">
          {/* Notification Bell */}
          <div className="flex justify-center">
            <NotificationBell />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4 transition-colors duration-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">Point Art Hub</h1>

            {/* Top Right Navigation */}
            <div className="flex items-center gap-3">
              {/* Settings */}
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="text-foreground hover:bg-accent hover:text-accent-foreground border-border"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>

              {/* Profile */}
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="text-foreground hover:bg-accent hover:text-accent-foreground border-border"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>

              {/* Sign Out Button */}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-foreground hover:bg-accent hover:text-accent-foreground border-border"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-background transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;