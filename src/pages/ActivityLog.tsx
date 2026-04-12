import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { ArrowLeft, Search, RefreshCw, Activity, Clock, User, Package } from "lucide-react";

interface ActivityEntry {
  id: string;
  created_at: string;
  module: string;
  description: string;
  employee: string;
  amount: number | null;
  extra?: string;
}

const MODULE_COLORS: Record<string, string> = {
  Stationery: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
  "Gift Store": "bg-green-100 dark:bg-green-900/30 text-green-700",
  Embroidery: "bg-purple-100 dark:bg-purple-900/30 text-purple-700",
  Machines: "bg-orange-100 dark:bg-orange-900/30 text-orange-700",
  "Art Services": "bg-pink-100 dark:bg-pink-900/30 text-pink-700",
};

const formatUGX = (n: number | null) =>
  n != null ? `UGX ${n.toLocaleString()}` : "—";

const formatDateTime = (iso: string | null) => {
  if (!iso) return { date: "—", time: "—" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
};

export default function ActivityLog() {
  const navigate = useNavigate();
  const { isAdmin } = useUser();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [liveIndicator, setLiveIndicator] = useState(false);
  const liveFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch profiles — index by BOTH profiles.id and profiles.user_id (auth uid)
      // so lookups work regardless of which UUID done_by/updated_by stores
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, sales_initials");
      const profileMap: Record<string, string> = {};
      (profileRows || []).forEach((p: any) => {
        const label = [p.full_name, p.sales_initials ? `(${p.sales_initials})` : ""]
          .filter(Boolean).join(" ").trim();
        if (p.id) profileMap[p.id] = label;
        if (p.user_id) profileMap[p.user_id] = label;
      });
      const resolveEmployee = (id: string | null): string =>
        id ? (profileMap[id] || "Unknown") : "Unknown";

      const [statRes, giftRes, embRes, machRes, artRes] = await Promise.all([
        // Stationery Sales — join to stationery item name + profile (sold_by has FK)
        supabase
          .from("stationery_sales")
          .select("id, created_at, total_amount, quantity, selling_price, stationery!item_id(item), profiles!sold_by(full_name, sales_initials)")
          .order("created_at", { ascending: false })
          .limit(500),

        // Gift Daily Sales (sold_by has FK)
        supabase
          .from("gift_daily_sales")
          .select("id, created_at, item, quantity, spx, profiles!sold_by(full_name, sales_initials)")
          .order("created_at", { ascending: false })
          .limit(500),

        // Embroidery — done_by FK to profiles.id; correct column names
        supabase
          .from("embroidery")
          .select("id, created_at, job_description, quotation, client_name, profiles!done_by(full_name, sales_initials)")
          .order("created_at", { ascending: false })
          .limit(500),

        // Machines — done_by FK to profiles.id
        (supabase as any)
          .from("machines")
          .select("id, created_at, machine_type, quantity, sales, done_by, profiles!done_by(full_name, sales_initials)")
          .order("created_at", { ascending: false })
          .limit(500),

        // Art Services — done_by FK to profiles.id
        (supabase as any)
          .from("art_services")
          .select("id, created_at, service_name, quantity, sales, description, done_by, profiles!done_by(full_name, sales_initials)")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      const combined: ActivityEntry[] = [];

      // Stationery
      (statRes.data || []).forEach((r: any) => {
        const profile = r.profiles;
        const emp = profile ? `${profile.full_name || ""}${profile.sales_initials ? ` (${profile.sales_initials})` : ""}`.trim() : "Unknown";
        combined.push({
          id: `stat-${r.id}`,
          created_at: r.created_at || "",
          module: "Stationery",
          description: r.stationery?.item || "Stationery item",
          employee: emp || "Unknown",
          amount: r.total_amount,
          extra: `Qty: ${r.quantity}`,
        });
      });

      // Gift Store
      (giftRes.data || []).forEach((r: any) => {
        const profile = r.profiles;
        const emp = profile ? `${profile.full_name || ""}${profile.sales_initials ? ` (${profile.sales_initials})` : ""}`.trim() : "Unknown";
        combined.push({
          id: `gift-${r.id}`,
          created_at: r.created_at || "",
          module: "Gift Store",
          description: r.item,
          employee: emp || "Unknown",
          amount: (r.spx || 0) * (r.quantity || 1),
          extra: `Qty: ${r.quantity}`,
        });
      });

      // Embroidery
      (embRes.data || []).forEach((r: any) => {
        const profile = r.profiles;
        const emp = profile
          ? `${profile.full_name || ""}${profile.sales_initials ? ` (${profile.sales_initials})` : ""}`.trim()
          : "Unknown";
        combined.push({
          id: `emb-${r.id}`,
          created_at: r.created_at || "",
          module: "Embroidery",
          description: r.job_description || "Embroidery job",
          employee: emp || "Unknown",
          amount: r.quotation,
          extra: r.client_name ? `Client: ${r.client_name}` : undefined,
        });
      });

      // Machines — done_by FK JOIN
      (machRes.data || []).forEach((r: any) => {
        const profile = r.profiles;
        const profileName = profile ? `${profile.full_name || ""}${profile.sales_initials ? ` (${profile.sales_initials})` : ""}`.trim() : "";
        const emp = profileName || resolveEmployee(r.done_by) || "Unknown";
        combined.push({
          id: `mach-${r.id}`,
          created_at: r.created_at || "",
          module: "Machines",
          description: r.machine_type,
          employee: emp,
          amount: r.sales,
          extra: undefined,
        });
      });

      // Art Services — done_by FK JOIN
      (artRes.data || []).forEach((r: any) => {
        const profile = r.profiles;
        const profileName = profile ? `${profile.full_name || ""}${profile.sales_initials ? ` (${profile.sales_initials})` : ""}`.trim() : "";
        const emp = profileName || resolveEmployee(r.done_by) || "Unknown";
        combined.push({
          id: `art-${r.id}`,
          created_at: r.created_at || "",
          module: "Art Services",
          description: r.service_name,
          employee: emp,
          amount: r.sales,
          extra: r.description || undefined,
        });
      });

      // Sort by most recent first
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEntries(combined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Real-time subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    const flashLive = () => {
      setLiveIndicator(true);
      if (liveFlashRef.current) clearTimeout(liveFlashRef.current);
      liveFlashRef.current = setTimeout(() => setLiveIndicator(false), 2000);
    };

    const handleChange = () => {
      flashLive();
      fetchAll();
    };

    const channel = supabase
      .channel("activity-log-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "stationery_sales" }, handleChange)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gift_daily_sales" }, handleChange)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "embroidery" }, handleChange)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "machines" }, handleChange)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "art_services" }, handleChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "embroidery" }, handleChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "machines" }, handleChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "art_services" }, handleChange)
      .subscribe();

    return () => {
      if (liveFlashRef.current) clearTimeout(liveFlashRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const filtered = entries.filter((e) => {
    if (moduleFilter !== "all" && e.module !== moduleFilter) return false;
    if (dateFilter) {
      const entryDate = e.created_at.slice(0, 10);
      if (entryDate !== dateFilter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        e.employee.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Access restricted to admins only.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-red-600" />
              Activity Log
              <span className="flex items-center gap-1.5 ml-1">
                <span className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-300 ${liveIndicator ? "bg-green-400 scale-125" : "bg-green-500"} animate-pulse`} />
                <span className="text-xs font-normal text-green-600 dark:text-green-400">Live</span>
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">Track every entry made by your employees — time, date, module</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {["Stationery", "Gift Store", "Embroidery", "Machines", "Art Services"].map((mod) => {
          const count = entries.filter((e) => e.module === mod).length;
          return (
            <Card key={mod} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setModuleFilter(mod)}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground truncate">{mod}</p>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground">entries</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee, item, module..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="Stationery">Stationery</SelectItem>
                <SelectItem value="Gift Store">Gift Store</SelectItem>
                <SelectItem value="Embroidery">Embroidery</SelectItem>
                <SelectItem value="Machines">Machines</SelectItem>
                <SelectItem value="Art Services">Art Services</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-[160px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            {(moduleFilter !== "all" || dateFilter || search) && (
              <Button variant="ghost" size="sm" onClick={() => { setModuleFilter("all"); setDateFilter(""); setSearch(""); }}>
                Clear filters
              </Button>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} of {entries.length} entries
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 dark:from-red-950/30 to-pink-50 dark:to-pink-950/30 border-b pb-3 pt-4 px-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-600" />
            All Activity — sorted by most recent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 [&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                <TableRow className="border-b-2 border-red-100 dark:border-red-900/50">
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">#</TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">
                    <Clock className="inline h-3.5 w-3.5 mr-1 text-red-500" />Time
                  </TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">Date</TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">
                    <User className="inline h-3.5 w-3.5 mr-1 text-red-500" />Employee
                  </TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">Module</TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">
                    <Package className="inline h-3.5 w-3.5 mr-1 text-red-500" />Item / Service
                  </TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold whitespace-nowrap">Details</TableHead>
                  <TableHead className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-red-50 dark:to-red-950/30 font-semibold text-right whitespace-nowrap">Amount (UGX)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-red-400" />
                      Loading activity...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      No activity found for the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry, idx) => {
                    const { date, time } = formatDateTime(entry.created_at);
                    return (
                      <TableRow key={entry.id} className="hover:bg-red-50/30 dark:bg-red-950/10 transition-colors">
                        <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-red-700 whitespace-nowrap">{time}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{date}</TableCell>
                        <TableCell className="font-medium text-sm whitespace-nowrap">{entry.employee}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-semibold ${MODULE_COLORS[entry.module] || "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                            {entry.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">{entry.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.extra || "—"}</TableCell>
                        <TableCell className="text-right font-semibold text-sm text-green-700 whitespace-nowrap">
                          {formatUGX(entry.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
