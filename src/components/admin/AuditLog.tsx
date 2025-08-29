import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Filter, RefreshCw, AlertTriangle } from "lucide-react";
import { resetSupabaseSchemaCache, checkTableExists, waitForTable } from "@/utils/supabaseSchemaReset";
import FallbackAuditLog from "./FallbackAuditLog";

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [error, setError] = useState<string | null>(null);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      setShouldUseFallback(false);
      
      // Check if the audit_log table exists
      const tableExists = await checkTableExists("audit_log");
      if (!tableExists) {
        // Try to reset the schema cache and check again
        await resetSupabaseSchemaCache();
        const tableExistsAfterReset = await checkTableExists("audit_log");
        if (!tableExistsAfterReset) {
          // Wait a bit more for the table to become available
          const tableAvailable = await waitForTable("audit_log");
          if (!tableAvailable) {
            setShouldUseFallback(true);
            throw new Error("Audit log table not found. Please ensure the database migration has been applied.");
          }
        }
      }
      
      let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Apply action filter
      if (filter !== "all") {
        query = query.eq("action", filter);
      }
      
      // Apply time range filter
      const now = new Date();
      let fromDate: Date;
      
      switch (timeRange) {
        case "1d":
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "3d":
          fromDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case "7d":
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      query = query.gte("created_at", fromDate.toISOString());
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Audit log fetch error:", error);
        setError(error.message);
        
        // If the error indicates the table doesn't exist, use fallback
        if (error.message.includes("not found in schema cache") || 
            error.message.includes("does not exist")) {
          setShouldUseFallback(true);
        }
        
        throw error;
      }
      
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      setError(error.message);
      toast({
        title: "Error fetching audit logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter, timeRange]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "USER_CREATE":
      case "PROFILE_UPDATE":
      case "ROLE_CHANGE":
        return "bg-green-100 text-green-800";
      case "USER_DELETE":
        return "bg-red-100 text-red-800";
      case "USER_CREATE_FAILED":
      case "ROLE_CHANGE_FAILED":
      case "USER_DELETE_FAILED":
        return "bg-red-100 text-red-800";
      case "ROLE_CHANGE_DENIED":
      case "USER_DELETE_DENIED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatAction = (action: string) => {
    switch (action) {
      case "USER_CREATE":
        return "User Created";
      case "USER_DELETE":
        return "User Deleted";
      case "PROFILE_UPDATE":
        return "Profile Updated";
      case "ROLE_CHANGE":
        return "Role Changed";
      case "USER_CREATE_FAILED":
        return "User Creation Failed";
      case "ROLE_CHANGE_FAILED":
        return "Role Change Failed";
      case "USER_DELETE_FAILED":
        return "User Deletion Failed";
      case "ROLE_CHANGE_DENIED":
        return "Role Change Denied";
      case "USER_DELETE_DENIED":
        return "User Deletion Denied";
      default:
        return action.replace(/_/g, " ");
    }
  };

  // If we should use the fallback component
  if (shouldUseFallback) {
    return <FallbackAuditLog />;
  }

  if (error) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Audit Log - Error
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-medium text-yellow-800">Database Error</h3>
            </div>
            <p className="text-yellow-700 mb-3">
              {error}
            </p>
            <p className="text-sm text-yellow-600">
              The audit log table may not exist in the database yet or there might be a schema cache issue. 
              Try refreshing the page or contact your administrator. You can also try the retry button above.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Audit Log
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Action Type</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_CREATE">User Created</SelectItem>
                <SelectItem value="USER_DELETE">User Deleted</SelectItem>
                <SelectItem value="PROFILE_UPDATE">Profile Updated</SelectItem>
                <SelectItem value="ROLE_CHANGE">Role Changed</SelectItem>
                <SelectItem value="USER_CREATE_FAILED">Creation Failed</SelectItem>
                <SelectItem value="ROLE_CHANGE_FAILED">Role Change Failed</SelectItem>
                <SelectItem value="USER_DELETE_FAILED">Deletion Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="3d">Last 3 Days</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.user_name || "Unknown User"}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.user_id ? log.user_id.substring(0, 8) : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {formatAction(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {log.table_name && (
                          <div>Table: {log.table_name}</div>
                        )}
                        {log.record_id && (
                          <div>Record ID: {log.record_id.substring(0, 8)}...</div>
                        )}
                        {log.new_values?.role && (
                          <div>Role: {log.new_values.role}</div>
                        )}
                        {log.new_values?.full_name && (
                          <div>Name: {log.new_values.full_name}</div>
                        )}
                        {log.new_values?.email && (
                          <div>Email: {log.new_values.email}</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading audit logs..." : "No audit logs found for the selected filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditLog;