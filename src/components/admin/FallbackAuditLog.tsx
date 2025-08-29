import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Database, ArrowUpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * FallbackAuditLog Component
 * A fallback component to display when the audit_log table is not available
 * Provides options to create the table and insert a test record
 */
const FallbackAuditLog = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "creating" | "success" | "error">("idle");
  const { toast } = useToast();

  const createAuditLogTable = async () => {
    setLoading(true);
    setStatus("creating");
    
    try {
      // SQL to create the audit_log table
      const createTableSQL = `
        -- Create audit_log table for tracking admin actions
        CREATE TABLE IF NOT EXISTS public.audit_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
          user_name TEXT,
          action TEXT NOT NULL,
          table_name TEXT,
          record_id UUID,
          old_values JSONB,
          new_values JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Enable Row Level Security
        ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Admins can view audit logs" 
        ON public.audit_log 
        FOR SELECT 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
          )
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
        CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
      `;

      // This approach might not work without admin privileges
      // But we're trying as a last resort
      const { error } = await supabase.rpc('pgcode', { query: createTableSQL });
      
      if (error) {
        console.error("Error creating audit_log table:", error);
        throw error;
      }
      
      // Insert a test record
      const { error: insertError } = await supabase.from('audit_log').insert([
        {
          user_name: 'System',
          action: 'TABLE_CREATED',
          table_name: 'audit_log',
          new_values: { message: 'Test record to verify audit_log table is working' }
        }
      ]);
      
      if (insertError) {
        console.error("Error inserting test record:", insertError);
        throw insertError;
      }
      
      setStatus("success");
      toast({
        title: "Success",
        description: "Audit log table created successfully. Please refresh the page.",
      });
    } catch (error) {
      console.error("Error:", error);
      setStatus("error");
      toast({
        title: "Error",
        description: "Could not create audit log table. Admin privileges may be required.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Audit Log - Table Not Found
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPage}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh Page
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Database Error</h3>
          </div>
          <p className="text-yellow-700 mb-3">
            Could not find the table 'public.audit_log' in the schema cache
          </p>
          <p className="text-sm text-yellow-600 mb-2">
            The audit log table may not exist in the database yet. You can try creating it directly using the button below.
          </p>
          <p className="text-xs text-yellow-500">
            Note: This requires database admin privileges and may not work for all users.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-800">Create Audit Log Table</h3>
            </div>
            <p className="text-blue-700 mb-4">
              Attempt to create the audit_log table directly in the database. This may require admin privileges.
            </p>
            <div className="flex items-center gap-4">
              <Button
                onClick={createAuditLogTable}
                disabled={loading || status === "success"}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Table...
                  </>
                ) : status === "success" ? (
                  <>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Table Created
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Create Table
                  </>
                )}
              </Button>
              
              {status === "success" && (
                <Button variant="outline" onClick={refreshPage}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              )}
            </div>
          </div>

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-800">Creation Failed</h3>
              </div>
              <p className="text-red-700 mb-3">
                Failed to create the audit_log table. This may require database admin privileges.
              </p>
              <p className="text-sm text-red-600">
                Please contact your administrator to ensure the audit_log table is created in the database.
              </p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">Alternative Solutions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Contact your administrator to create the audit_log table</li>
              <li>Run the <code className="bg-gray-100 px-1 py-0.5 rounded">create-audit-table.js</code> script with admin credentials</li>
              <li>Use the Supabase SQL Editor to manually create the table</li>
              <li>Check if migrations have been properly applied to your database</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FallbackAuditLog;