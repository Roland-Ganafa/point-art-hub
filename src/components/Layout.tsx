import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, User, Shield, Users, BarChart3, FileText, TrendingUp, Home, Sun, Moon, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import Logo from "@/components/ui/Logo";
import NotificationBell from "@/components/NotificationBell";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({
  icon: Icon,
  label,
  onClick,
  collapsed,
  title,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  collapsed: boolean;
  title?: string;
}) => (
  <Button
    variant="ghost"
    onClick={onClick}
    title={collapsed ? label : title}
    className={`w-full text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 ${
      collapsed ? "justify-center px-0" : "justify-start"
    }`}
  >
    <Icon className={`w-4 h-4 flex-shrink-0 ${collapsed ? "" : "mr-3"}`} />
    {!collapsed && <span className="truncate">{label}</span>}
  </Button>
);

const Layout = ({ children }: LayoutProps) => {
  const { user, profile, loading, signOut, isAdmin, authError } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sidebar-collapsed") === "true"; }
    catch { return false; }
  });

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-pink-50 to-purple-50">
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <img
              src="/point-art-logo.svg"
              alt="Point Art Hub"
              className="w-20 h-20 object-contain drop-shadow-md"
            />
            <div className="text-center leading-tight">
              <div className="text-3xl font-bold tracking-tight">
                <span className="text-gray-800">Point</span>
                <span className="text-pink-600 ml-1">Art</span>
              </div>
              <div className="text-xs font-semibold tracking-widest uppercase text-gray-400 mt-0.5">Hub</div>
            </div>
          </div>

          {/* Animated loader */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-pink-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" />
            </div>
            <p className="text-sm text-gray-400 font-medium tracking-wide animate-pulse">Loading...</p>
          </div>
        </div>
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
      <aside
        className={`relative bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out flex-shrink-0 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-accent transition-colors duration-200"
        >
          {collapsed
            ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
            : <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          }
        </button>

        {/* Logo Section */}
        <div className={`border-b border-border flex items-center ${collapsed ? "p-3 justify-center" : "p-6"}`}>
          {collapsed ? (
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">PA</span>
            </div>
          ) : (
            <Logo />
          )}
        </div>

        {/* User Info Section */}
        {!collapsed && (
          <div className="p-4 border-b border-border">
            <div className="text-sm text-muted-foreground">
              <div className="mb-2">
                <span className="block font-medium text-foreground truncate">
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
        )}

        {/* User avatar when collapsed */}
        {collapsed && (
          <div className="p-3 border-b border-border flex justify-center">
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center"
              title={profile?.full_name || user.email}
            >
              <span className="text-white text-xs font-bold">
                {(profile?.full_name || user.email || "U")[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <div className={`border-b border-border ${collapsed ? "p-2" : "p-4"}`}>
          <NavItem
            icon={theme === 'light' ? Moon : Sun}
            label={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            onClick={toggleTheme}
            collapsed={collapsed}
          />
        </div>

        {/* Navigation Menu */}
        <nav className={`flex-1 ${collapsed ? "p-2" : "p-4"}`}>
          <div className="space-y-1">
            <NavItem icon={Home} label="Home" onClick={() => navigate('/')} collapsed={collapsed} />

            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={BarChart3} label="Dashboard" onClick={() => navigate('/')} collapsed={collapsed} />
            )}
            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={Shield} label="Admin Panel" onClick={() => navigate('/admin')} collapsed={collapsed} title="Admin Panel - Manage users and system settings" />
            )}
            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={Users} label="Customers" onClick={() => navigate('/customers')} collapsed={collapsed} />
            )}
            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={FileText} label="Reports" onClick={() => navigate('/reports')} collapsed={collapsed} />
            )}
            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={TrendingUp} label="Analytics" onClick={() => navigate('/analytics')} collapsed={collapsed} />
            )}
            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={FileText} label="Invoices" onClick={() => navigate('/invoices')} collapsed={collapsed} />
            )}
            {(isAdmin || profile?.role === 'admin') && (
              <NavItem icon={Activity} label="Activity Log" onClick={() => navigate('/activity-log')} collapsed={collapsed} />
            )}
          </div>
        </nav>

        {/* Bottom Section with Notification */}
        <div className={`border-t border-border ${collapsed ? "p-2" : "p-4"}`}>
          <div className="flex justify-center">
            <NotificationBell />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-6 py-4 transition-colors duration-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-foreground">Point Art Hub</h1>

            {/* Top Right Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/settings')}
                className="text-foreground hover:bg-accent hover:text-accent-foreground border-border"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="text-foreground hover:bg-accent hover:text-accent-foreground border-border"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
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
        <main className="flex-1 p-4 bg-background transition-colors duration-200 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;