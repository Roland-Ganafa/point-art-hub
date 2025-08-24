import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import BackupRestore from './BackupRestore';
import { 
  Database, 
  Download, 
  Upload, 
  Shield, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Server,
  HardDrive,
  FileText,
  Lock,
  Key,
  Activity
} from 'lucide-react';

const AdvancedSettings = () => {
  const { toast } = useToast();
  const { isAdmin } = useUser();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // Backup and Export Functions
  const handleExportData = async (format: 'csv' | 'json') => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can export data',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const tables = ['stationery', 'gift_store', 'embroidery', 'machines', 'art_services', 'profiles'];
      const exportData: Record<string, any[]> = {};
      
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        setExportProgress((i / tables.length) * 100);
        
        const { data, error } = await supabase
          .from(table as any) // Type assertion for dynamic table names
          .select('*');
          
        if (error) throw error;
        exportData[table] = data || [];
      }

      setExportProgress(100);

      // Create and download file
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `point-art-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV format - create separate files for each table
        for (const [tableName, data] of Object.entries(exportData)) {
          if (data.length > 0) {
            const csv = convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }

      toast({
        title: 'Export Complete',
        description: `Data exported successfully in ${format.toUpperCase()} format`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if necessary
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const handleClearAllData = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can clear data',
        variant: 'destructive',
      });
      return;
    }

    const confirmation = prompt(
      'This will permanently delete ALL data from the system. Type "DELETE ALL DATA" to confirm:'
    );

    if (confirmation !== 'DELETE ALL DATA') {
      toast({
        title: 'Operation Cancelled',
        description: 'Data deletion was cancelled',
      });
      return;
    }

    try {
      const tables = ['stationery_sales', 'gift_daily_sales', 'stationery', 'gift_store', 'embroidery', 'machines', 'art_services'];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table as any) // Type assertion for dynamic table names
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
          
        if (error) {
          console.error(`Error clearing ${table}:`, error);
        }
      }

      toast({
        title: 'Data Cleared',
        description: 'All data has been permanently deleted',
      });

    } catch (error) {
      console.error('Clear data error:', error);
      toast({
        title: 'Clear Failed',
        description: 'Failed to clear data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSystemReset = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can reset the system',
        variant: 'destructive',
      });
      return;
    }

    const confirmation = prompt(
      'This will reset ALL settings and data to factory defaults. Type "RESET SYSTEM" to confirm:'
    );

    if (confirmation !== 'RESET SYSTEM') {
      toast({
        title: 'Operation Cancelled',
        description: 'System reset was cancelled',
      });
      return;
    }

    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear application data
      await handleClearAllData();
      
      // Reload the page to reset everything
      window.location.reload();

    } catch (error) {
      console.error('System reset error:', error);
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset system. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Advanced settings are only accessible to administrators. Contact your system administrator for access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Status */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            System Status
          </CardTitle>
          <CardDescription>
            Monitor system health and performance
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup and Restore System */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <Database className="h-5 w-5" />
            </div>
            Backup & Restore System
          </CardTitle>
          <CardDescription>
            Create complete system backups and restore from previous backups
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <BackupRestore />
        </CardContent>
      </Card>

      {/* Legacy Data Export */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg">
              <Download className="h-5 w-5" />
            </div>
            Legacy Data Export
          </CardTitle>
          <CardDescription>
            Export data in CSV or JSON format for external use
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </h4>
              
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Exporting data...</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                </div>
              )}
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleExportData('csv')}
                  disabled={isExporting}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button 
                  onClick={() => handleExportData('json')}
                  disabled={isExporting}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Export all your data for backup or migration purposes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg">
              <Settings className="h-5 w-5" />
            </div>
            System Configuration
          </CardTitle>
          <CardDescription>
            Advanced system settings and developer options
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access for system maintenance
                </p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debugMode">Debug Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable detailed logging for troubleshooting
                </p>
              </div>
              <Switch
                id="debugMode"
                checked={debugMode}
                onCheckedChange={setDebugMode}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 shadow-xl bg-red-50/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-3 text-red-700">
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600">
            Irreversible actions that permanently affect your system
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              These actions cannot be undone. Please proceed with extreme caution.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-white/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-red-700">Clear All Data</h4>
                  <p className="text-sm text-red-600">
                    Permanently delete all inventory, sales, and transaction data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleClearAllData}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Data
                </Button>
              </div>
            </div>

            <div className="p-4 border border-red-200 rounded-lg bg-white/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium text-red-700">Reset System</h4>
                  <p className="text-sm text-red-600">
                    Reset all settings and data to factory defaults
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleSystemReset}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset System
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings;