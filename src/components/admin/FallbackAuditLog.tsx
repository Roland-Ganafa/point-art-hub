import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, Database, Copy, CheckCircle } from "lucide-react";

/**
 * FallbackAuditLog Component
 * A fallback component to display when the audit_log table is not available
 * Provides SQL script and instructions to create the table
 */
const FallbackAuditLog = () => {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // SQL script to create the audit_log table
  const createTableSQL = `-- Create audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- Create policy for admins to view audit logs
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

-- Create policy for system to insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);

-- Insert a test record
INSERT INTO public.audit_log (user_name, action, table_name, new_values)
VALUES (
  'System',
  'TABLE_CREATED',
  'audit_log',
  '{"message": "Audit log table created successfully"}'::jsonb
);

-- Verify the table was created
SELECT COUNT(*) as record_count FROM public.audit_log;`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(createTableSQL);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "SQL script copied to clipboard",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
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
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Database Table Missing</h3>
          </div>
          <p className="text-yellow-700 mb-2">
            The <code className="bg-yellow-100 px-1.5 py-0.5 rounded">audit_log</code> table does not exist in your database.
          </p>
          <p className="text-sm text-yellow-600">
            This table is required to track administrative actions and system events.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">How to Create the Table</h3>
          </div>
          
          <ol className="space-y-3 text-blue-700 mb-4">
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">1.</span>
              <span>Open your <strong>Supabase Dashboard</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">2.</span>
              <span>Navigate to <strong>SQL Editor</strong> in the left sidebar</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">3.</span>
              <span>Click <strong>New Query</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">4.</span>
              <span>Copy the SQL script below and paste it into the editor</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">5.</span>
              <span>Click <strong>Run</strong> to execute the script</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-6">6.</span>
              <span>Return to this page and click <strong>Refresh</strong></span>
            </li>
          </ol>

          <Button
            onClick={copyToClipboard}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {copied ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL Script
              </>
            )}
          </Button>
        </div>

        {/* SQL Script */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-medium text-sm">SQL Script</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="text-white hover:text-gray-300 hover:bg-gray-800"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <pre className="text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">
            <code>{createTableSQL}</code>
          </pre>
        </div>

        {/* Alternative Solutions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-3">Alternative Solutions:</h3>
          <ul className="space-y-2 text-gray-700 text-sm">
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>
                <strong>Run migrations:</strong> If you have a migrations folder, run{" "}
                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">supabase db push</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>
                <strong>Use migration files:</strong> Check if there's a migration file in your project that creates this table
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400">•</span>
              <span>
                <strong>Contact administrator:</strong> If you don't have access to the SQL Editor, ask your database administrator
              </span>
            </li>
          </ul>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={refreshPage}
            variant="outline"
            className="w-full md:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page After Creating Table
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FallbackAuditLog;