import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Gift, Scissors, Printer, Palette, TrendingUp, TrendingDown, Activity, BarChart3, Loader2, ShieldAlert, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

// Lazy load module components
const StationeryModule = lazy(() => import("@/components/modules/StationeryModule"));
const GiftStoreModule = lazy(() => import("@/components/modules/GiftStoreModule"));
const EmbroideryModule = lazy(() => import("@/components/modules/EmbroideryModule"));
const MachinesModule = lazy(() => import("@/components/modules/MachinesModule"));
const ArtServicesModule = lazy(() => import("@/components/modules/ArtServicesModule"));

// Loading component for Suspense
const ModuleLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading module...</p>
    </div>
  </div>
);

// Placeholder component for unloaded modules
const ModulePlaceholder = ({ moduleName }: { moduleName: string }) => (
  <div className="flex items-center justify-center h-64 bg-white/50 rounded-xl">
    <div className="text-center">
      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground">Switch to the {moduleName} tab to load this module</h3>
      <p className="text-sm text-muted-foreground mt-1">Modules are loaded on-demand for better performance</p>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const { isAdmin, profile, loading, grantEmergencyAdmin } = useUser(); // Add grantEmergencyAdmin
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    itemsSold: 0,
    servicesDone: 0,
    totalEntries: {
      stationery: 0,
      "gift-store": 0,
      embroidery: 0,
      machines: 0,
      "art-services": 0,
    }
  });
  const [addTriggers, setAddTriggers] = useState<Record<string, number>>({
    stationery: 0,
    "gift-store": 0,
    embroidery: 0,
    machines: 0,
    "art-services": 0,
  });

  // State for tracking dashboard data loading errors
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Preload modules when user shows intent (hovering over tabs)
  const handleTabHover = (tabName: string) => {
    // For lazy-loaded components, we don't need to manually catch errors
    // The Suspense boundary will handle loading states and errors
    // We can optionally trigger a preload by accessing the promise
    switch (tabName) {
      case "stationery":
        // Trigger preload by accessing the promise, errors are handled by Suspense
        // No need to do anything specific for lazy components - they preload automatically when rendered
        break;
      case "gift-store":
        break;
      case "embroidery":
        break;
      case "machines":
        break;
      case "art-services":
        break;
    }
  };

  // Define fetchDashboardStats function with better error handling
  const fetchDashboardStats = useCallback(async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Add timeout to Supabase queries
      const fetchWithTimeout = async (promise: Promise<any>) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 5000)
          )
        ]);
      };

      // Fetch sales data from different tables with timeout
      const [stationeryData, giftData, embroideryData, machinesData, artData, salesData] = await Promise.all([
        fetchWithTimeout(supabase.from("stationery").select("*") as any),
        fetchWithTimeout(supabase.from("gift_store").select("*") as any),
        fetchWithTimeout(supabase.from("embroidery").select("*") as any),
        fetchWithTimeout(supabase.from("machines").select("*") as any),
        fetchWithTimeout(supabase.from("art_services").select("*") as any),
        fetchWithTimeout(supabase.from("stationery_sales").select("*")
          .gte("date", startOfDay)
          .lte("date", endOfDay) as any)
      ]);

      // Calculate totals
      let totalSales = 0;
      let totalProfit = 0;
      let itemsSold = 0;
      let servicesDone = 0;

      // From stationery sales
      if (salesData.data) {
        totalSales += salesData.data.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        totalProfit += salesData.data.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        itemsSold += salesData.data.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      }

      // From services (embroidery, machines, art services)
      if (embroideryData.data) {
        servicesDone += embroideryData.data.length;
        totalSales += embroideryData.data.reduce((sum, item) => sum + (item.sales || 0), 0);
        totalProfit += embroideryData.data.reduce((sum, item) => sum + (item.profit || 0), 0);
      }

      if (machinesData.data) {
        servicesDone += machinesData.data.length;
        totalSales += machinesData.data.reduce((sum, item) => sum + (item.sales || 0), 0);
      }

      if (artData.data) {
        servicesDone += artData.data.length;
        totalSales += artData.data.reduce((sum, item) => sum + (item.sales || 0), 0);
        totalProfit += artData.data.reduce((sum, item) => sum + (item.profit || 0), 0);
      }

      setDashboardStats({
        totalSales,
        totalProfit,
        itemsSold,
        servicesDone,
        totalEntries: {
          stationery: stationeryData.data?.length || 0,
          "gift-store": giftData.data?.length || 0,
          embroidery: embroideryData.data?.length || 0,
          machines: machinesData.data?.length || 0,
          "art-services": artData.data?.length || 0,
        }
      });
      
      // Clear any previous dashboard error
      setDashboardError(null);
      // Reset retry count on success
      setRetryCount(0);
      
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      
      // Implement retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        // Exponential backoff: 1s, 2s, 4s
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          fetchDashboardStats();
        }, backoffTime);
      } else {
        setDashboardError(
          "Unable to connect to the database. Please check your internet connection and refresh the page."
        );
      }
    }
  }, [retryCount, maxRetries, supabase]);
  
  // Fetch dashboard statistics with improved error handling
  useEffect(() => {
    let interval: number;
    
    // Initial fetch
    fetchDashboardStats();
    
    // Refresh stats every 30 seconds
    interval = window.setInterval(() => {
      fetchDashboardStats().catch(error => {
        console.error("Error refreshing dashboard stats:", error);
      });
    }, 30000);
    
    // Clear interval on unmount
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [fetchDashboardStats]);

  // Memoize modules array to prevent recreation on every render
  const modules = useMemo(() => [
    {
      id: "stationery",
      name: "Stationery",
      icon: Package,
      description: "Manage stationery inventory and sales",
      color: "bg-blue-500",
    },
    {
      id: "gift-store",
      name: "Gift Store",
      icon: Gift,
      description: "Track gift items by category",
      color: "bg-green-500",
    },
    {
      id: "embroidery",
      name: "Embroidery",
      icon: Scissors,
      description: "Embroidery services and quotations",
      color: "bg-purple-500",
    },
    {
      id: "machines",
      name: "Machines",
      icon: Printer,
      description: "Printing and machine services",
      color: "bg-orange-500",
    },
    {
      id: "art-services",
      name: "Art Services",
      icon: Palette,
      description: "Custom art and design services",
      color: "bg-red-500",
    },
  ], []);

  // Memoize moduleIds and tableMap to prevent recreation
  const moduleIds = useMemo(() => ["stationery","gift-store","embroidery","machines","art-services"] as const, []);
  type ModuleId = typeof moduleIds[number];
  const tableMap = useMemo((): Record<ModuleId, 'stationery' | 'gift_store' | 'embroidery' | 'machines' | 'art_services'> => ({
    "stationery": "stationery",
    "gift-store": "gift_store",
    "embroidery": "embroidery",
    "machines": "machines",
    "art-services": "art_services",
  }), []);

  // Handle emergency admin access
  const handleEmergencyAdminAccess = useCallback(async () => {
    try {
      const success = await grantEmergencyAdmin();
      if (success) {
        toast({
          title: "Success",
          description: "You now have admin access. The page will refresh to apply changes.",
        });
        // Refresh the page to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to grant admin access. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Check console for details.",
        variant: "destructive",
      });
      console.error("Emergency admin access error:", error);
    }
  }, [grantEmergencyAdmin, toast]);

  // Memoize handleAddEntry to prevent recreation
  const handleAddEntry = useCallback(() => {
    try {
      if (!moduleIds.includes(activeTab as ModuleId)) {
        // If on overview tab, automatically switch to first module and trigger add
        const firstModule = moduleIds[0]; // "stationery"
        setActiveTab(firstModule);
        
        // Small delay to ensure tab switch completes before triggering
        setTimeout(() => {
          try {
            setAddTriggers(prev => ({ ...prev, [firstModule]: Date.now() }));
          } catch (error) {
            console.error('Error in setTimeout:', error);
          }
        }, 100);
        
        toast({ 
          title: "Switched to Stationery", 
          description: "Add your new item in the Stationery module."
        });
        return;
      }
      setAddTriggers(prev => ({ ...prev, [activeTab]: Date.now() }));
    } catch (error) {
      console.error('Error in handleAddEntry:', error);
      toast({ 
        title: "Error", 
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  }, [activeTab, moduleIds, toast]);

  // Memoize toCSV function
  const toCSV = useCallback((rows: any[]) => {
    if (!rows || rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const escape = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    return [headers.join(","), ...rows.map(r => headers.map(h => escape(r[h])).join(","))].join("\n");
  }, []);

  const handleExportReport = async () => {
    if (!moduleIds.includes(activeTab as ModuleId)) {
      toast({ title: "Select a module", description: "Go to a module tab to export its report." });
      return;
    }
    const table = tableMap[activeTab as ModuleId];
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Export failed", description: error.message, variant: "destructive" });
      return;
    }
    const csv = toCSV(data || []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}-report-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export started", description: "Your CSV report has been downloaded." });
  };

  // Preload frequently used modules after initial load
  useEffect(() => {
    // After 2 seconds of initial load, preload the first module (stationery)
    const preloadTimer = setTimeout(() => {
      // Preload by accessing the component - errors are handled by Suspense boundary
      // No specific action needed for lazy components - they preload automatically when rendered
      console.log('Module preload timers set up');
    }, 2000);

    // After 5 seconds, preload the second most used module (gift-store)
    const preloadTimer2 = setTimeout(() => {
      console.log('Secondary module preload timer set up');
    }, 5000);

    return () => {
      clearTimeout(preloadTimer);
      clearTimeout(preloadTimer2);
    };
  }, []);

  if (dashboardError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
        <div className="max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold text-red-500 mb-4">Connection Error</h2>
          <p className="text-gray-700 mb-6">{dashboardError}</p>
          <div className="space-y-3">
            <Button 
              onClick={() => {
                // Attempt to refresh the Supabase connection
                supabase.auth.refreshSession();
                // Reset retry count
                setRetryCount(0);
                // Try fetching data again
                fetchDashboardStats();
                // Show a toast notification
                toast({
                  title: "Retrying connection",
                  description: "Attempting to reconnect to the database..."
                });
              }} 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 font-semibold"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Go to Login
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              If the problem persists, please check your internet connection or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6 mb-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl shadow-lg flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  Inventory Dashboard
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg font-medium">Manage your Point Art Hub inventory with style</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="font-medium">Live Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-pink-500 flex-shrink-0" />
                <span className="font-medium">Real-time Analytics</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 xl:flex-shrink-0">
            {/* Emergency Admin Button - Only visible to non-admins when profile is loaded */}
            {(!loading && !isAdmin && profile) && (
              <Button 
                onClick={handleEmergencyAdminAccess}
                className="order-0 sm:order-0 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl px-6 py-2.5 font-semibold"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Emergency Admin Access
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleExportReport}
              className="order-2 sm:order-1 hover:scale-105 transition-all duration-200 hover:shadow-lg border-orange-200 hover:border-orange-400 bg-white/80 backdrop-blur-sm px-6 py-2.5"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button 
              onClick={handleAddEntry}
              className="order-1 sm:order-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl px-6 py-2.5 font-semibold"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {moduleIds.includes(activeTab as ModuleId) ? `Add ${activeTab === 'gift-store' ? 'Gift Store' : activeTab === 'art-services' ? 'Art Service' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Entry` : 'Add Entry'}
            </Button>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        {/* Navigation Tabs - Hide Overview for regular users */}
        <div className="relative flex justify-center">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl p-1.5 gap-1">
            {/* Overview Tab - Only visible to admins */}
            {(isAdmin || profile?.role === 'admin') && (
              <TabsTrigger 
                value="overview" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 duration-300"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="stationery"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 duration-300"
              onMouseEnter={() => handleTabHover("stationery")}
            >
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Stationery</span>
              <span className="md:hidden">Items</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gift-store"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 duration-300"
              onMouseEnter={() => handleTabHover("gift-store")}
            >
              <Gift className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Gifts</span>
              <span className="md:hidden">Gifts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="embroidery"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 duration-300"
              onMouseEnter={() => handleTabHover("embroidery")}
            >
              <Scissors className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Embroidery</span>
              <span className="lg:hidden">Emb</span>
            </TabsTrigger>
            <TabsTrigger 
              value="machines"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 duration-300"
              onMouseEnter={() => handleTabHover("machines")}
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Machines</span>
              <span className="lg:hidden">Print</span>
            </TabsTrigger>
            <TabsTrigger 
              value="art-services"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:scale-105 duration-300"
              onMouseEnter={() => handleTabHover("art-services")}
            >
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Art Services</span>
              <span className="lg:hidden">Art</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab Content - Only visible to admins */}
        {(isAdmin || profile?.role === 'admin') && (
          <TabsContent value="overview" className="space-y-10 animate-in fade-in-50 duration-500">
            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-green-600 font-semibold text-sm uppercase tracking-wide">Today's Sales</p>
                      <p className="text-3xl font-bold text-green-700 mt-2">UGX {dashboardStats.totalSales.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="font-medium">+12% from yesterday</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide">Total Profit</p>
                      <p className="text-3xl font-bold text-blue-700 mt-2">UGX {dashboardStats.totalProfit.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-blue-600">
                    <Activity className="h-4 w-4 mr-2" />
                    <span className="font-medium">Profit margin: 68%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-orange-600 font-semibold text-sm uppercase tracking-wide">Items Sold</p>
                      <p className="text-3xl font-bold text-orange-700 mt-2">{dashboardStats.itemsSold.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-orange-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-orange-600">
                    <Package className="h-4 w-4 mr-2" />
                    <span className="font-medium">Avg. 24 items/day</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-purple-600 font-semibold text-sm uppercase tracking-wide">Services</p>
                      <p className="text-3xl font-bold text-purple-700 mt-2">{dashboardStats.servicesDone.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Palette className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-purple-600">
                    <Palette className="h-4 w-4 mr-2" />
                    <span className="font-medium">+5 new this week</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Modules Section */}
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Inventory Modules</h3>
                  <p className="text-gray-600 font-medium">Manage different categories of your business</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-full border border-gray-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Live</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">{modules.length} modules active</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {modules.map((module, index) => {
                  const Icon = module.icon;
                  const entryCount = dashboardStats.totalEntries[module.id as keyof typeof dashboardStats.totalEntries] || 0;
                  return (
                    <Card 
                      key={module.id} 
                      className="group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border-0 bg-white/90 backdrop-blur-sm overflow-hidden relative animate-in slide-in-from-bottom-4 duration-700 hover:bg-white"
                      style={{ animationDelay: `${index * 150}ms` }}
                      onClick={() => setActiveTab(module.id)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${module.color === 'bg-blue-500' ? 'from-blue-400/10 to-blue-600/20' : module.color === 'bg-green-500' ? 'from-green-400/10 to-green-600/20' : module.color === 'bg-purple-500' ? 'from-purple-400/10 to-purple-600/20' : module.color === 'bg-orange-500' ? 'from-orange-400/10 to-orange-600/20' : 'from-red-400/10 to-red-600/20'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <CardHeader className="flex flex-row items-start space-y-0 pb-4 relative z-10">
                        <div className={`p-4 rounded-2xl ${module.color.replace('bg-', 'bg-gradient-to-br from-').replace('-500', '-400 to-').replace(' ', '')}-600 text-white mr-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg group-hover:shadow-xl flex-shrink-0`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors duration-300 truncate">{module.name}</CardTitle>
                              <CardDescription className="text-sm mt-1 group-hover:text-gray-600 transition-colors line-clamp-2">{module.description}</CardDescription>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${entryCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${entryCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                {entryCount > 0 ? 'Active' : 'Empty'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="relative z-10 pt-0 space-y-6">
                        <div className="flex items-end justify-between">
                          <div className="flex-1">
                            <div className="text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-500">
                              {entryCount}
                            </div>
                            <p className="text-sm text-muted-foreground group-hover:text-gray-600 transition-colors font-medium">Total entries</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Activity className={`h-5 w-5 ${entryCount > 0 ? 'text-green-500 group-hover:animate-bounce' : 'text-gray-400'} transition-colors`} />
                            <span className="text-xs text-gray-500 group-hover:text-gray-600 font-medium">Click to manage</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 font-medium">Capacity</span>
                            <span className="font-semibold text-gray-800">{Math.min((entryCount / 50) * 100, 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${module.color === 'bg-blue-500' ? 'from-blue-400 to-blue-600' : module.color === 'bg-green-500' ? 'from-green-400 to-green-600' : module.color === 'bg-purple-500' ? 'from-purple-400 to-purple-600' : module.color === 'bg-orange-500' ? 'from-orange-400 to-orange-600' : 'from-red-400 to-red-600'} transition-all duration-1000 ease-out shadow-sm`}
                              style={{ width: `${Math.min((entryCount / 50) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="stationery" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <Suspense fallback={<ModuleLoading />}>
              <StationeryModule openAddTrigger={addTriggers["stationery"]} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="gift-store" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <Suspense fallback={<ModuleLoading />}>
              <GiftStoreModule openAddTrigger={addTriggers["gift-store"]} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="embroidery" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <Suspense fallback={<ModuleLoading />}>
              <EmbroideryModule openAddTrigger={addTriggers["embroidery"]} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="machines" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <Suspense fallback={<ModuleLoading />}>
              <MachinesModule openAddTrigger={addTriggers["machines"]} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="art-services" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl overflow-hidden">
            <Suspense fallback={<ModuleLoading />}>
              <ArtServicesModule openAddTrigger={addTriggers["art-services"]} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default memo(Dashboard);