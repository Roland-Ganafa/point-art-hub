import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  Database, 
  Download, 
  Upload, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  FileText,
  Archive,
  RotateCcw,
  Clock,
  Users,
  Package
} from 'lucide-react';

interface BackupInfo {
  id: string;
  name: string;
  created_at: string;
  size: string;
  tables: string[];
  version: string;
  description?: string;
}

interface BackupData {
  metadata: {
    created_at: string;
    version: string;
    description: string;
    tables: string[];
    total_records: number;
  };
  data: Record<string, any[]>;
}

const BackupRestore = () => {
  const { toast } = useToast();
  const { isAdmin } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [backupDescription, setBackupDescription] = useState('');
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Database tables to backup
  const BACKUP_TABLES = [
    'stationery',
    'gift_store', 
    'embroidery',
    'machines',
    'art_services',
    'stationery_sales',
    'gift_daily_sales',
    'customers',
    'invoices',
    'profiles'
  ];

  const createFullBackup = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can create backups',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      const backupData: BackupData = {
        metadata: {
          created_at: new Date().toISOString(),
          version: '1.0.0',
          description: backupDescription || `Backup created on ${format(new Date(), 'PPpp')}`,
          tables: BACKUP_TABLES,
          total_records: 0
        },
        data: {}
      };

      let totalRecords = 0;

      // Backup each table
      for (let i = 0; i < BACKUP_TABLES.length; i++) {
        const table = BACKUP_TABLES[i];
        setBackupProgress(((i + 1) / BACKUP_TABLES.length) * 90);

        try {
          const { data, error } = await supabase
            .from(table)
            .select('*');

          if (error) {
            console.warn(`Warning: Could not backup table ${table}:`, error);
            backupData.data[table] = [];
          } else {
            backupData.data[table] = data || [];
            totalRecords += (data || []).length;
          }
        } catch (tableError) {
          console.warn(`Warning: Table ${table} might not exist, skipping...`);
          backupData.data[table] = [];
        }
      }

      backupData.metadata.total_records = totalRecords;
      setBackupProgress(95);

      // Create and download backup file
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const filename = `point-art-hub-backup-${timestamp}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setBackupProgress(100);

      // Save backup info to localStorage for history
      const backupInfo: BackupInfo = {
        id: `backup-${timestamp}`,
        name: filename,
        created_at: new Date().toISOString(),
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        tables: BACKUP_TABLES,
        version: '1.0.0',
        description: backupDescription || `Backup created on ${format(new Date(), 'PPpp')}`
      };

      const existingHistory = JSON.parse(localStorage.getItem('backup_history') || '[]');
      const updatedHistory = [backupInfo, ...existingHistory].slice(0, 10); // Keep last 10 backups
      localStorage.setItem('backup_history', JSON.stringify(updatedHistory));
      setBackupHistory(updatedHistory);

      toast({
        title: 'Backup Created Successfully',
        description: `Full system backup created with ${totalRecords} records across ${BACKUP_TABLES.length} tables`,
      });

      setBackupDescription('');

    } catch (error) {
      console.error('Backup creation error:', error);
      toast({
        title: 'Backup Failed',
        description: 'Failed to create backup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file);
        toast({
          title: 'File Selected',
          description: `Selected backup file: ${file.name}`,
        });
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a valid JSON backup file',
          variant: 'destructive',
        });
      }
    }
  };

  const restoreFromBackup = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can restore backups',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a backup file to restore',
        variant: 'destructive',
      });
      return;
    }

    const confirmation = prompt(
      'This will replace ALL current data with the backup data. Type "RESTORE BACKUP" to confirm:'
    );

    if (confirmation !== 'RESTORE BACKUP') {
      toast({
        title: 'Restore Cancelled',
        description: 'Backup restore was cancelled',
      });
      return;
    }

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      // Read and parse backup file
      const fileContent = await selectedFile.text();
      const backupData: BackupData = JSON.parse(fileContent);

      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup file format');
      }

      setRestoreProgress(5);

      let restoredTables = 0;
      let totalRecordsRestored = 0;

      // Restore each table
      for (const [tableName, tableData] of Object.entries(backupData.data)) {
        setRestoreProgress(10 + (restoredTables / Object.keys(backupData.data).length) * 80);

        try {
          if (Array.isArray(tableData) && tableData.length > 0) {
            // Clear existing data
            await supabase
              .from(tableName)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');

            // Insert backup data in batches
            const batchSize = 100;
            for (let i = 0; i < tableData.length; i += batchSize) {
              const batch = tableData.slice(i, i + batchSize);
              const { error } = await supabase
                .from(tableName)
                .insert(batch);

              if (error) {
                console.error(`Error restoring ${tableName} batch:`, error);
              } else {
                totalRecordsRestored += batch.length;
              }
            }
          }
        } catch (tableError) {
          console.warn(`Warning: Could not restore table ${tableName}:`, tableError);
        }

        restoredTables++;
      }

      setRestoreProgress(95);

      // Clear any cached data
      localStorage.removeItem('stationery_items');
      localStorage.removeItem('gift_store_items');

      setRestoreProgress(100);

      toast({
        title: 'Restore Completed',
        description: `Successfully restored ${totalRecordsRestored} records across ${restoredTables} tables`,
      });

      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore backup. Please check the file format and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Load backup history on component mount
  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('backup_history') || '[]');
    setBackupHistory(history);
  }, []);

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Backup and restore functionality is only available to administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Backup Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg">
              <Archive className="h-5 w-5" />
            </div>
            Create System Backup
          </CardTitle>
          <CardDescription>
            Create a complete backup of all your system data including inventory, sales, customers, and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-description">Backup Description (Optional)</Label>
            <Textarea
              id="backup-description"
              placeholder="Enter a description for this backup..."
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creating backup...</span>
                <span>{Math.round(backupProgress)}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={createFullBackup}
              disabled={isCreatingBackup}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Full Backup
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-green-500" />
              <span>Inventory Data</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>Sales Records</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Customer Data</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-500" />
              <span>System Settings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Backup Section */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg">
              <RotateCcw className="h-5 w-5" />
            </div>
            Restore from Backup
          </CardTitle>
          <CardDescription>
            Restore your system from a previously created backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Warning:</strong> Restoring a backup will replace ALL current data with the backup data. 
              Make sure to create a current backup before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="backup-file">Select Backup File</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Selected: {selectedFile.name}</span>
              </div>
            )}
          </div>

          {isRestoring && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Restoring backup...</span>
                <span>{Math.round(restoreProgress)}%</span>
              </div>
              <Progress value={restoreProgress} className="w-full" />
            </div>
          )}

          <Button 
            onClick={restoreFromBackup}
            disabled={!selectedFile || isRestoring}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Restore Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              Recent Backups
            </CardTitle>
            <CardDescription>
              History of backups created from this browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {backupHistory.map((backup) => (
                <div 
                  key={backup.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{backup.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {backup.version}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Created: {format(new Date(backup.created_at), 'PPpp')}
                    </div>
                    {backup.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {backup.description}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{backup.size}</div>
                    <div className="text-xs text-gray-500">
                      {backup.tables.length} tables
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BackupRestore;