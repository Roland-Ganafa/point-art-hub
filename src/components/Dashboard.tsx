import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, Package, Gift, Scissors, Printer, Palette, TrendingUp, TrendingDown, Activity, BarChart3, ShieldAlert, RefreshCw, Download, FileText, ChevronDown, Calendar, Trophy, AlertTriangle, Star } from "lucide-react";
import CustomLoader from "@/components/ui/CustomLoader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Lazy load module components
const StationeryModule = lazy(() => import("@/components/modules/StationeryModule"));
const GiftStoreModule = lazy(() => import("@/components/modules/GiftStoreModule"));
const EmbroideryModule = lazy(() => import("@/components/modules/EmbroideryModule"));
const MachinesModule = lazy(() => import("@/components/modules/MachinesModule"));
const ArtServicesModule = lazy(() => import("@/components/modules/ArtServicesModule"));
import DashboardGreeting from "./DashboardGreeting";

// Loading component for Suspense
const ModuleLoading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-2">
      <CustomLoader size="lg" />
      <p className="text-muted-foreground">Loading module...</p>
    </div>
  </div>
);

// Placeholder component for unloaded modules
const ModulePlaceholder = ({ moduleName }: { moduleName: string }) => (
  <div className="flex items-center justify-center h-64 bg-white/50 dark:bg-gray-900/50 rounded-xl">
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
  const { isAdmin, profile, loading } = useUser();
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
  const [dateFilter, setDateFilter] = useState<"today" | "month" | "all">("today");
  const [exportPopoverOpen, setExportPopoverOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<"today" | "week" | "month" | "all" | "custom">("all");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  interface BestSeller { name: string; category: string; module: string; totalQty: number; totalRevenue: number; currentStock: number | null; }
  interface TopService { name: string; module: string; count: number; totalRevenue: number; }
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(false);
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
    // Don't fetch if auth is still loading
    if (loading) return;

    try {
      // Add timeout to Supabase queries - Increased to 15 seconds for better reliability
      const fetchWithTimeout = async (promise: Promise<any>) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 15000)
          )
        ]);
      };

      // Build filters based on selection
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (dateFilter === "today") {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        startDate = todayStart.toISOString();
        endDate = todayEnd.toISOString();
      } else if (dateFilter === "month") {
        const today = new Date();
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      }

      // Fetch data from different tables with timeout
      const serviceQuery = (table: string) => {
        let q = (supabase as any).from(table).select("*");
        if (startDate && endDate) {
          q = q.gte("date", startDate.split('T')[0]).lte("date", endDate.split('T')[0]);
        }
        return q as Promise<any>;
      };

      const salesQuery = (table: string) => {
        let q = (supabase as any).from(table).select("*");
        if (startDate && endDate) {
          q = q.gte("date", startDate).lte("date", endDate);
        }
        return q as Promise<any>;
      };

      const results = await Promise.allSettled([
        fetchWithTimeout((supabase as any).from("stationery").select("*") as Promise<any>),
        fetchWithTimeout((supabase as any).from("gift_store").select("*") as Promise<any>),
        fetchWithTimeout(serviceQuery("embroidery")),
        fetchWithTimeout(serviceQuery("machines")),
        fetchWithTimeout(serviceQuery("art_services")),
        fetchWithTimeout(salesQuery("stationery_sales")),
        fetchWithTimeout((supabase as any).from("invoices").select("*").eq('status', 'paid') as Promise<any>)
      ]);

      const [
        stationeryResult,
        giftResult,
        embroideryResult,
        machinesResult,
        artResult,
        salesResult,
        invoicesResult
      ] = results;

      // Log errors for debugging but continue with available data
      const errors: string[] = [];
      results.forEach((res, index) => {
        if (res.status === 'rejected') {
          const names = ['stationery', 'gift-store', 'embroidery', 'machines', 'art-services', 'sales'];
          console.error(`Error fetching ${names[index]}:`, res.reason);
          errors.push(`${names[index]}: ${res.reason.message || 'Unknown error'}`);
        }
      });

      // Helper to safely get data
      const getData = (result: PromiseSettledResult<any>) =>
        result.status === 'fulfilled' && result.value.data ? result.value.data : [];

      const stationeryData = getData(stationeryResult);
      const giftData = getData(giftResult);
      const embroideryData = getData(embroideryResult);
      const machinesData = getData(machinesResult);
      const artData = getData(artResult);
      const salesData = getData(salesResult);
      const invoiceData = getData(invoicesResult);

      // Calculate totals
      let totalSales = 0;
      let totalProfit = 0;
      let itemsSold = 0;
      let servicesDone = 0;

      // From stationery sales
      if (salesData.length > 0) {
        totalSales += salesData.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0);
        totalProfit += salesData.reduce((sum: number, sale: any) => sum + (sale.profit || 0), 0);
        itemsSold += salesData.reduce((sum: number, sale: any) => sum + (sale.quantity || 0), 0);
      }

      // From services (embroidery, machines, art services)
      if (embroideryData.length > 0) {
        servicesDone += embroideryData.length;
        totalSales += embroideryData.reduce((sum: number, item: any) => sum + (item.sales || 0), 0);
        totalProfit += embroideryData.reduce((sum: number, item: any) => sum + (item.profit || 0), 0);
      }

      if (machinesData.length > 0) {
        servicesDone += machinesData.length;
        totalSales += machinesData.reduce((sum: number, item: any) => sum + (item.sales || 0), 0);
      }

      if (artData.length > 0) {
        servicesDone += artData.length;
        totalSales += artData.reduce((sum: number, item: any) => sum + (Number(item.sales) || 0), 0);
        totalProfit += artData.reduce((sum: number, item: any) => sum + (Number(item.profit) || 0), 0);
      }

      // From paid invoices
      if (invoiceData.length > 0) {
        const filteredInvoices = dateFilter === 'all' ? invoiceData : invoiceData.filter((inv: any) => {
          if (!startDate || !endDate) return true;
          const invDate = new Date(inv.invoice_date);
          return invDate >= new Date(startDate) && invDate <= new Date(endDate);
        });
        totalSales += filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount) || 0), 0);
      }

      setDashboardStats({
        totalSales,
        totalProfit,
        itemsSold,
        servicesDone,
        totalEntries: {
          stationery: stationeryData.length,
          "gift-store": giftData.length,
          embroidery: embroideryData.length,
          machines: machinesData.length,
          "art-services": artData.length,
        }
      });

      // If ALL requests failed, then show the error page. 
      // Otherwise, just clear generic errors and retry count.
      if (errors.length === 6) {
        throw new Error(`Failed to load any data. Details: ${errors.join(', ')}`);
      }

      // Clear any previous dashboard error
      setDashboardError(null);
      // Reset retry count on success (partial or full)
      setRetryCount(0);

    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);

      // Implement retry logic with exponential backoff
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        const backoffTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${maxRetries})`);

        setTimeout(() => {
          fetchDashboardStats();
        }, backoffTime);
      } else {
        setDashboardError(
          `Unable to load dashboard data. ${error.message || "Please check your internet connection."}`
        );
      }
    }
  }, [retryCount, maxRetries, loading, dateFilter]);

  // Fetch dashboard statistics with improved error handling
  useEffect(() => {
    let interval: number;

    // Only fetch if auth is not loading
    if (!loading) {
      // Initial fetch
      fetchDashboardStats();

      // Refresh stats every 30 seconds
      interval = window.setInterval(() => {
        fetchDashboardStats().catch(error => {
          console.error("Error refreshing dashboard stats:", error);
        });
      }, 30000);
    }

    // Clear interval on unmount
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [fetchDashboardStats, loading]);

  // Real-time subscriptions — refresh dashboard immediately when any sales/service entry is added
  useEffect(() => {
    if (loading) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stationery_sales" }, () => fetchDashboardStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gift_daily_sales" }, () => fetchDashboardStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "embroidery" }, () => fetchDashboardStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "machines" }, () => fetchDashboardStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "art_services" }, () => fetchDashboardStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, fetchDashboardStats]);

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
  const moduleIds = useMemo(() => ["stationery", "gift-store", "embroidery", "machines", "art-services"] as const, []);
  type ModuleId = typeof moduleIds[number];
  const tableMap = useMemo((): Record<ModuleId, 'stationery' | 'gift_store' | 'embroidery' | 'machines' | 'art_services'> => ({
    "stationery": "stationery",
    "gift-store": "gift_store",
    "embroidery": "embroidery",
    "machines": "machines",
    "art-services": "art_services",
  }), []);

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

  // Map each module tab to its sales/service table and date field
  const exportTableMap: Record<string, { table: string; dateField: string; label: string }> = useMemo(() => ({
    "stationery":   { table: "stationery_sales", dateField: "created_at", label: "Stationery Sales" },
    "gift-store":   { table: "gift_daily_sales", dateField: "created_at", label: "Gift Store Sales" },
    "embroidery":   { table: "embroidery",        dateField: "date",       label: "Embroidery Services" },
    "machines":     { table: "machines",          dateField: "date",       label: "Machine Services" },
    "art-services": { table: "art_services",      dateField: "date",       label: "Art Services" },
  }), []);

  const getExportDates = useCallback(() => {
    const now = new Date();
    const toStr = (d: Date) => d.toISOString().split("T")[0];
    switch (exportPreset) {
      case "today":  return { from: toStr(now), to: toStr(now) };
      case "week":   { const d = new Date(now); d.setDate(d.getDate() - 7); return { from: toStr(d), to: toStr(now) }; }
      case "month":  return { from: toStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: toStr(now) };
      case "custom": return { from: exportFrom, to: exportTo };
      default:       return { from: null, to: null };
    }
  }, [exportPreset, exportFrom, exportTo]);

  const handleExport = useCallback(async (format: "csv" | "pdf") => {
    setExportPopoverOpen(false);
    const { from, to } = getExportDates();
    const today = new Date().toISOString().slice(0, 10);
    const dateLabel = from && to ? `${from}_to_${to}` : "all-time";

    // Build a profiles map: uuid → full name (for resolving sold_by / done_by)
    const { data: profileRows } = await (supabase as any)
      .from("profiles")
      .select("id, full_name, sales_initials");
    const profileMap: Record<string, string> = {};
    (profileRows || []).forEach((p: any) => {
      profileMap[p.id] = p.full_name || p.sales_initials || p.id;
    });

    // Resolve a UUID field to a name, leaving non-UUIDs (already a name) unchanged
    const resolveName = (val: string | null | undefined): string => {
      if (!val) return "-";
      return profileMap[val] || val;
    };

    // Post-process rows: replace sold_by / done_by / updated_by UUIDs with names
    const resolveNames = (rows: any[]): any[] =>
      rows.map(r => {
        const out = { ...r };
        if ("sold_by" in out)   out.sold_by   = resolveName(out.sold_by);
        if ("done_by" in out)   out.done_by   = resolveName(out.done_by);
        if ("updated_by" in out) delete out.updated_by; // internal, not useful in export
        // Flatten nested profile join if present (stationery_sales / gift_daily_sales)
        if (out.profiles && typeof out.profiles === "object") {
          if ("sold_by" in out) out.sold_by = out.profiles.full_name || out.profiles.sales_initials || out.sold_by;
          delete out.profiles;
        }
        // Flatten nested stationery join if present
        if (out.stationery && typeof out.stationery === "object") {
          out.item_name = out.stationery.item || out.item_name;
          delete out.stationery;
        }
        return out;
      });

    // Fetch data for one module or all
    const fetchTable = async (tabKey: string) => {
      const cfg = exportTableMap[tabKey];
      if (!cfg) return [];
      // Use JOIN for tables with FK on sold_by → profiles
      const selectClause =
        cfg.table === "stationery_sales"  ? "*, stationery!item_id(item), profiles!sold_by(full_name, sales_initials)" :
        cfg.table === "gift_daily_sales"   ? "*, profiles!sold_by(full_name, sales_initials)" :
        "*";
      let q = (supabase as any).from(cfg.table).select(selectClause).order(cfg.dateField, { ascending: false });
      if (from && to) {
        q = q.gte(cfg.dateField, from).lte(cfg.dateField, cfg.dateField === "date" ? to : `${to}T23:59:59`);
      }
      const { data, error } = await q;
      if (error) { console.error(error); return []; }
      return resolveNames(data || []);
    };

    const isModule = moduleIds.includes(activeTab as ModuleId);
    const tabsToExport = isModule ? [activeTab] : (moduleIds as unknown as string[]);

    toast({ title: "Preparing export…", description: "Fetching data, please wait." });

    if (format === "csv") {
      const rows: any[] = [];
      for (const tab of tabsToExport) {
        const data = await fetchTable(tab);
        const label = exportTableMap[tab]?.label || tab;
        data.forEach((r: any) => rows.push({ Module: label, ...r }));
      }
      if (!rows.length) { toast({ title: "No data", description: "No records found for the selected date range." }); return; }
      const csv = toCSV(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `point-art-report-${isModule ? activeTab : "all"}-${dateLabel}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "CSV exported", description: `${rows.length} rows downloaded.` });
      return;
    }

    // PDF export
    const doc = new jsPDF({ orientation: "landscape" });
    const todayStr = new Date().toLocaleDateString("en-GB");
    const rangeStr = from && to ? `${from} to ${to}` : "All Time";

    // Header banner
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 297, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Point Art Hub — Sales Report", 12, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${rangeStr} | Generated: ${todayStr}`, 12, 18);

    let yPos = 30;

    for (const tab of tabsToExport) {
      const data = await fetchTable(tab);
      const cfg = exportTableMap[tab];
      if (!cfg) continue;

      if (data.length === 0) continue;

      // Section title
      if (yPos > 170) { doc.addPage(); yPos = 15; }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(cfg.label, 12, yPos);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`${data.length} records`, 12, yPos + 5);
      yPos += 10;

      // Build columns from first row keys, skip internal IDs
      const skip = new Set(["id", "item_id", "user_id"]);
      const keys = Object.keys(data[0]).filter(k => !skip.has(k));
      const headers = keys.map(k => k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
      const rows = data.map((r: any) => keys.map(k => {
        const v = r[k];
        if (v === null || v === undefined) return "-";
        if (typeof v === "number") return v.toLocaleString();
        if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}T/)) return v.slice(0, 16).replace("T", " ");
        return String(v);
      }));

      const moduleColors: Record<string, [number, number, number]> = {
        "stationery":   [37, 99, 235],
        "gift-store":   [168, 85, 247],
        "embroidery":   [16, 185, 129],
        "machines":     [234, 88, 12],
        "art-services": [239, 68, 68],
      };
      const color = moduleColors[tab] || [100, 100, 100];

      autoTable(doc, {
        startY: yPos,
        head: [headers],
        body: rows,
        headStyles: { fillColor: color, fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 12, right: 12 },
        tableWidth: "auto",
        didDrawPage: (d: any) => { yPos = d.cursor?.y ?? yPos; },
      });
      yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // Footer page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text(`Point Art Hub | Page ${i} of ${pageCount}`, 12, 205);
    }

    doc.save(`point-art-report-${isModule ? activeTab : "all"}-${dateLabel}.pdf`);
    toast({ title: "PDF exported", description: "Report downloaded successfully." });
  }, [activeTab, moduleIds, exportTableMap, getExportDates, toCSV, toast]);

  const fetchBestSellers = useCallback(async () => {
    if (loading) return;
    setBestSellersLoading(true);
    try {
      const now = new Date();
      let startDate: string | null = null;
      let endDate: string | null = null;
      if (dateFilter === "today") {
        const s = new Date(now); s.setHours(0, 0, 0, 0);
        const e = new Date(now); e.setHours(23, 59, 59, 999);
        startDate = s.toISOString(); endDate = e.toISOString();
      } else if (dateFilter === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      }

      let statQ = (supabase as any).from("stationery_sales").select("item_id, quantity, total_amount, stationery!item_id(item, category, quantity)");
      let giftQ = (supabase as any).from("gift_daily_sales").select("item, quantity, spx");
      let embQ  = (supabase as any).from("embroidery").select("item_name, quantity, total_amount, date");
      let machQ = (supabase as any).from("machines").select("machine_name, quantity, sales, date");
      let artQ  = (supabase as any).from("art_services").select("service_name, quantity, sales, date");

      if (startDate && endDate) {
        statQ = statQ.gte("created_at", startDate).lte("created_at", endDate);
        giftQ = giftQ.gte("created_at", startDate).lte("created_at", endDate);
        const ds = startDate.split("T")[0], de = endDate.split("T")[0];
        embQ  = embQ.gte("date", ds).lte("date", de);
        machQ = machQ.gte("date", ds).lte("date", de);
        artQ  = artQ.gte("date", ds).lte("date", de);
      }

      const [statRes, giftRes, giftStoreRes, embRes, machRes, artRes] = await Promise.all([
        statQ, giftQ,
        (supabase as any).from("gift_store").select("item, quantity"),
        embQ, machQ, artQ,
      ]);

      // Aggregate products
      const prodMap: Record<string, BestSeller> = {};
      (statRes.data || []).forEach((s: any) => {
        const info = s.stationery;
        const name = info?.item || "Unknown";
        if (!prodMap[name]) prodMap[name] = { name, category: info?.category || "Stationery", module: "Stationery", totalQty: 0, totalRevenue: 0, currentStock: info?.quantity ?? null };
        prodMap[name].totalQty += s.quantity || 0;
        prodMap[name].totalRevenue += s.total_amount || 0;
      });
      const giftStock = giftStoreRes.data || [];
      (giftRes.data || []).forEach((s: any) => {
        const name = s.item || "Unknown";
        if (!prodMap[name]) {
          const st = giftStock.find((g: any) => g.item === name);
          prodMap[name] = { name, category: "Gift Store", module: "Gift Store", totalQty: 0, totalRevenue: 0, currentStock: st?.quantity ?? null };
        }
        prodMap[name].totalQty += s.quantity || 0;
        prodMap[name].totalRevenue += (s.quantity || 0) * (s.spx || 0);
      });
      setBestSellers(Object.values(prodMap).filter(p => p.totalQty > 0).sort((a, b) => b.totalQty - a.totalQty).slice(0, 10));

      // Aggregate services
      const svcMap: Record<string, TopService> = {};
      const addSvc = (name: string, mod: string, rev: number) => {
        if (!name) return;
        if (!svcMap[name]) svcMap[name] = { name, module: mod, count: 0, totalRevenue: 0 };
        svcMap[name].count++;
        svcMap[name].totalRevenue += rev;
      };
      (embRes.data || []).forEach((s: any) => addSvc(s.item_name, "Embroidery", s.total_amount || 0));
      (machRes.data || []).forEach((s: any) => addSvc(s.machine_name, "Machines", s.sales || 0));
      (artRes.data || []).forEach((s: any) => addSvc(s.service_name, "Art Services", s.sales || 0));
      setTopServices(Object.values(svcMap).filter(s => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 6));
    } catch (e) {
      console.error("Error fetching best sellers:", e);
    } finally {
      setBestSellersLoading(false);
    }
  }, [loading, dateFilter]);

  useEffect(() => {
    if (!loading) fetchBestSellers();
  }, [fetchBestSellers, loading]);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 dark:from-orange-950/30 via-pink-50 to-purple-50 dark:to-purple-950/30">
        <div className="max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold text-red-500 mb-4">Connection Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{dashboardError}</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              If the problem persists, please check your internet connection or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 dark:from-orange-950/30 via-pink-50 to-purple-50 dark:to-purple-950/30 relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full px-2 sm:px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6 mb-10">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl shadow-lg flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DashboardGreeting />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
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

            <Popover open={exportPopoverOpen} onOpenChange={setExportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="order-2 sm:order-1 hover:scale-105 transition-all duration-200 hover:shadow-lg border-orange-200 dark:border-orange-800 hover:border-orange-400 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-2.5"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Export Report
                  <ChevronDown className="ml-2 h-3 w-3 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 space-y-4" align="end">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    <Calendar className="inline h-3 w-3 mr-1" />Date Range
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["today", "week", "month", "all", "custom"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setExportPreset(p)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          exportPreset === p
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-orange-300"
                        }`}
                      >
                        {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : p === "all" ? "All Time" : "Custom"}
                      </button>
                    ))}
                  </div>
                </div>
                {exportPreset === "custom" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                      <Input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                      <Input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                )}
                <div className="border-t pt-3 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport("csv")} className="w-full text-xs">
                    <Download className="mr-1.5 h-3 w-3" />Export CSV
                  </Button>
                  <Button size="sm" onClick={() => handleExport("pdf")} className="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white">
                    <FileText className="mr-1.5 h-3 w-3" />Export PDF
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Exporting: <span className="font-medium">{moduleIds.includes(activeTab as any) ? exportTableMap[activeTab]?.label : "All Modules"}</span>
                </p>
              </PopoverContent>
            </Popover>
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
            <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 shadow-xl p-1.5 gap-1">
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
                <span className="hidden md:inline">Gift Store</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Stats</h3>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                  <Button
                    variant={dateFilter === "today" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("today")}
                    className="rounded-lg text-xs"
                  >
                    Today
                  </Button>
                  <Button
                    variant={dateFilter === "month" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("month")}
                    className="rounded-lg text-xs"
                  >
                    This Month
                  </Button>
                  <Button
                    variant={dateFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setDateFilter("all")}
                    className="rounded-lg text-xs"
                  >
                    All Time
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/30 to-emerald-50 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-green-600 font-semibold text-sm uppercase tracking-wide">Total Sales</p>
                        <p className="text-3xl font-bold text-green-700 mt-2">UGX {dashboardStats.totalSales.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      <span className="font-medium capitalize">{dateFilter} Statistics</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-blue-100 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
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
                      <span className="font-medium">Net Profit</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 dark:from-orange-950/30 to-orange-100 dark:to-orange-900/30 border-orange-200 dark:border-orange-800 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
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
                      <span className="font-medium">Total Quantity</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/30 to-purple-100 dark:to-purple-900/30 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-purple-600 font-semibold text-sm uppercase tracking-wide">Services Done</p>
                        <p className="text-3xl font-bold text-purple-700 mt-2">{dashboardStats.servicesDone.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <Palette className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-purple-600">
                      <Palette className="h-4 w-4 mr-2" />
                      <span className="font-medium">Completed Services</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Best Sellers Section */}
              {(isAdmin || profile?.role === 'admin') && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-amber-500" />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Best Sellers</h3>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-0.5 rounded-full font-medium">Stock Intelligence</span>
                  </div>

                  {bestSellersLoading ? (
                    <div className="flex justify-center py-8"><CustomLoader size="md" /></div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Top Products - takes 2/3 width */}
                      <div className="xl:col-span-2">
                        <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                          <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 dark:from-amber-950/30 to-orange-50 dark:to-orange-950/30 border-b border-amber-100 dark:border-amber-900/50">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                <Star className="h-4 w-4 text-amber-500" />
                                Top Selling Products
                              </CardTitle>
                              <span className="text-xs text-gray-500 dark:text-gray-400">by quantity sold</span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            {bestSellers.length === 0 ? (
                              <div className="py-10 text-center text-gray-400">
                                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No sales data for this period</p>
                              </div>
                            ) : (() => {
                              const maxQty = bestSellers[0]?.totalQty || 1;
                              return (
                                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                  {bestSellers.map((item, i) => {
                                    const pct = (item.totalQty / maxQty) * 100;
                                    const isLow = item.currentStock !== null && item.currentStock <= 5;
                                    const isOut = item.currentStock !== null && item.currentStock <= 0;
                                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                                    return (
                                      <div key={item.name} className={`px-4 py-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors ${i < 3 ? "bg-gradient-to-r from-amber-50/30 to-transparent" : ""}`}>
                                        <div className="flex items-center gap-3 mb-1.5">
                                          <div className="w-6 text-center flex-shrink-0">
                                            {medal ? <span className="text-base">{medal}</span> : <span className="text-xs font-bold text-gray-400">#{i + 1}</span>}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">{item.name}</span>
                                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${item.module === "Stationery" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700" : "bg-green-100 dark:bg-green-900/30 text-green-700"}`}>
                                                {item.module}
                                              </span>
                                              {item.currentStock !== null && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center gap-0.5 ${isOut ? "bg-red-100 dark:bg-red-900/30 text-red-700" : isLow ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700"}`}>
                                                  {isOut || isLow ? <AlertTriangle className="h-2.5 w-2.5" /> : null}
                                                  {isOut ? "Out of stock" : isLow ? `Low: ${item.currentStock}` : `Stock: ${item.currentStock}`}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="text-right flex-shrink-0">
                                            <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{item.totalQty} sold</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">UGX {item.totalRevenue.toLocaleString()}</div>
                                          </div>
                                        </div>
                                        <div className="ml-9 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full transition-all duration-700 ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-orange-400" : "bg-blue-400"}`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Right column: Top Services + Low Stock Alerts */}
                      <div className="space-y-4">
                        {/* Top Services */}
                        <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
                          <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 dark:from-purple-950/30 to-pink-50 dark:to-pink-950/30 border-b border-purple-100 dark:border-purple-900/50">
                            <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-purple-500" />
                              Most Requested Services
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {topServices.length === 0 ? (
                              <div className="py-8 text-center text-gray-400">
                                <Scissors className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No service data for this period</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                                {topServices.map((svc, i) => {
                                  const modColor: Record<string, string> = {
                                    "Embroidery": "bg-purple-100 dark:bg-purple-900/30 text-purple-700",
                                    "Machines": "bg-orange-100 dark:bg-orange-900/30 text-orange-700",
                                    "Art Services": "bg-red-100 dark:bg-red-900/30 text-red-700",
                                  };
                                  return (
                                    <div key={svc.name} className="px-4 py-3 flex items-center gap-3 hover:bg-purple-50/30 dark:hover:bg-purple-950/10 transition-colors">
                                      <span className="text-sm font-bold text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{svc.name}</p>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${modColor[svc.module] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{svc.module}</span>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{svc.count}×</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">UGX {svc.totalRevenue.toLocaleString()}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Low Stock Alert */}
                        {bestSellers.filter(p => p.currentStock !== null && p.currentStock <= 5).length > 0 && (
                          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden border-l-4 border-l-red-400">
                            <CardHeader className="pb-2 bg-gradient-to-r from-red-50 dark:from-red-950/30 to-orange-50 dark:to-orange-950/30 border-b border-red-100 dark:border-red-900/50">
                              <CardTitle className="text-sm font-bold text-red-700 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Restock Needed
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="divide-y divide-red-50 dark:divide-red-900/30">
                                {bestSellers.filter(p => p.currentStock !== null && p.currentStock <= 5).map(p => (
                                  <div key={p.name} className="px-4 py-2.5 flex items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-950/20">
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[140px]">{p.name}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.module}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.currentStock! <= 0 ? "bg-red-100 dark:bg-red-900/30 text-red-700" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700"}`}>
                                      {p.currentStock! <= 0 ? "OUT" : `${p.currentStock} left`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Modules Section */}
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inventory Modules</h3>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Manage different categories of your business</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
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
                        className="group cursor-pointer hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden relative animate-in slide-in-from-bottom-4 duration-700 hover:bg-white"
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
                                <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors duration-300 truncate">{module.name} Module</CardTitle>
                                <CardDescription className="text-sm mt-1 group-hover:text-gray-600 dark:text-gray-400 transition-colors line-clamp-2">{module.description}</CardDescription>
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${entryCount > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}>
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
                              <p className="text-sm text-muted-foreground group-hover:text-gray-600 dark:text-gray-400 transition-colors font-medium">Total entries</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Activity className={`h-5 w-5 ${entryCount > 0 ? 'text-green-500 group-hover:animate-bounce' : 'text-gray-400'} transition-colors`} />
                              <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:text-gray-400 font-medium">Click to manage</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">Capacity</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{Math.min((entryCount / 50) * 100, 100).toFixed(0)}%</span>
                            </div>
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
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
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl">
              <Suspense fallback={<ModuleLoading />}>
                <StationeryModule openAddTrigger={addTriggers["stationery"]} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="gift-store" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl">
              <Suspense fallback={<ModuleLoading />}>
                <GiftStoreModule openAddTrigger={addTriggers["gift-store"]} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="embroidery" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl">
              <Suspense fallback={<ModuleLoading />}>
                <EmbroideryModule openAddTrigger={addTriggers["embroidery"]} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="machines" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl">
              <Suspense fallback={<ModuleLoading />}>
                <MachinesModule openAddTrigger={addTriggers["machines"]} />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="art-services" className="animate-in fade-in-50 slide-in-from-right-4 duration-500">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border-0 shadow-2xl">
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