import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { 
  getBackupSettings, 
  saveBackupSettings, 
  getBackupHistory,
  isBackupDue,
  cleanupOldBackups,
  type BackupSettings 
} from '@/utils/backupUtils';
import { 
  Settings, 
  Clock, 
  HardDrive, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Archive,
  Calendar
} from 'lucide-react';

const BackupSettingsComponent = () => {
  const { toast } = useToast();
  const { isAdmin } = useUser();
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackupEnabled: false,
    backupFrequency: 'weekly',
    maxBackups: 10,
    backupTime: '02:00',
    includeUserData: true,
    compressionEnabled: true
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = getBackupSettings();
    setSettings(loadedSettings);
  }, []);

  const handleSaveSettings = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can modify backup settings',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      saveBackupSettings(settings);
      
      // Clean up old backups if max backups setting changed
      cleanupOldBackups();
      
      toast({
        title: 'Settings Saved',
        description: 'Backup settings have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving backup settings:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save backup settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      autoBackupEnabled: false,
      backupFrequency: 'weekly',
      maxBackups: 10,
      backupTime: '02:00',
      includeUserData: true,
      compressionEnabled: true
    });
  };

  const getNextBackupTime = (): string => {
    if (!settings.autoBackupEnabled) {
      return 'Disabled';
    }

    const now = new Date();
    const nextBackup = new Date();
    
    // Set time
    const [hours, minutes] = settings.backupTime.split(':');
    nextBackup.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // If time has passed today, move to next occurrence
    if (nextBackup <= now) {
      switch (settings.backupFrequency) {
        case 'daily':
          nextBackup.setDate(nextBackup.getDate() + 1);
          break;
        case 'weekly':
          nextBackup.setDate(nextBackup.getDate() + 7);
          break;
        case 'monthly':
          nextBackup.setMonth(nextBackup.getMonth() + 1);
          break;
      }
    }

    return nextBackup.toLocaleDateString() + ' at ' + nextBackup.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBackupStatus = () => {
    const history = getBackupHistory();
    const isDue = isBackupDue();
    
    if (history.length === 0) {
      return { status: 'warning', message: 'No backups found', color: 'text-orange-600' };
    }
    
    if (isDue && settings.autoBackupEnabled) {
      return { status: 'error', message: 'Backup overdue', color: 'text-red-600' };
    }
    
    const lastBackup = history[0];
    const lastBackupDate = new Date(lastBackup.created_at);
    const daysSince = Math.floor((Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) {
      return { status: 'success', message: 'Backed up today', color: 'text-green-600' };
    } else if (daysSince === 1) {
      return { status: 'success', message: 'Backed up yesterday', color: 'text-green-600' };
    } else if (daysSince <= 7) {
      return { status: 'success', message: `Backed up ${daysSince} days ago`, color: 'text-green-600' };
    } else {
      return { status: 'warning', message: `Last backup ${daysSince} days ago`, color: 'text-orange-600' };
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Backup settings are only accessible to administrators.
        </AlertDescription>
      </Alert>
    );
  }

  const backupStatus = getBackupStatus();

  return (
    <div className="space-y-6">
      {/* Backup Status */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <Archive className="h-5 w-5" />
            </div>
            Backup Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                backupStatus.status === 'success' ? 'bg-green-500' : 
                backupStatus.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="font-medium">Current Status</p>
                <p className={`text-sm ${backupStatus.color}`}>{backupStatus.message}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Next Backup</p>
                <p className="text-sm text-gray-600">{getNextBackupTime()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Total Backups</p>
                <p className="text-sm text-gray-600">{getBackupHistory().length} stored</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup Configuration */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg">
              <Settings className="h-5 w-5" />
            </div>
            Backup Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic backup schedules and retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Automatic Backup Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Enable scheduled automatic backups of your system data
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={settings.autoBackupEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoBackupEnabled: checked }))
              }
            />
          </div>

          {/* Backup Frequency */}
          <div className="space-y-2">
            <Label htmlFor="backup-frequency">Backup Frequency</Label>
            <Select 
              value={settings.backupFrequency} 
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                setSettings(prev => ({ ...prev, backupFrequency: value }))
              }
              disabled={!settings.autoBackupEnabled}
            >
              <SelectTrigger id="backup-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often automatic backups should be created
            </p>
          </div>

          {/* Backup Time */}
          <div className="space-y-2">
            <Label htmlFor="backup-time">Backup Time</Label>
            <Input
              id="backup-time"
              type="time"
              value={settings.backupTime}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, backupTime: e.target.value }))
              }
              disabled={!settings.autoBackupEnabled}
            />
            <p className="text-sm text-muted-foreground">
              Time of day when automatic backups should be created
            </p>
          </div>

          {/* Max Backups */}
          <div className="space-y-2">
            <Label htmlFor="max-backups">Maximum Backups to Keep</Label>
            <Select 
              value={settings.maxBackups.toString()} 
              onValueChange={(value) => 
                setSettings(prev => ({ ...prev, maxBackups: parseInt(value) }))
              }
            >
              <SelectTrigger id="max-backups">
                <SelectValue placeholder="Select maximum backups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 backups</SelectItem>
                <SelectItem value="10">10 backups</SelectItem>
                <SelectItem value="15">15 backups</SelectItem>
                <SelectItem value="20">20 backups</SelectItem>
                <SelectItem value="30">30 backups</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Older backups will be automatically removed when this limit is reached
            </p>
          </div>

          {/* Include User Data */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-user-data">Include User Data</Label>
              <p className="text-sm text-muted-foreground">
                Include user profiles and settings in backups
              </p>
            </div>
            <Switch
              id="include-user-data"
              checked={settings.includeUserData}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, includeUserData: checked }))
              }
            />
          </div>

          {/* Compression */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compression">Enable Compression</Label>
              <p className="text-sm text-muted-foreground">
                Compress backup files to save storage space
              </p>
            </div>
            <Switch
              id="compression"
              checked={settings.compressionEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, compressionEnabled: checked }))
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {isSaving ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleResetSettings}
              variant="outline"
              disabled={isSaving}
            >
              Reset to Defaults
            </Button>
          </div>

          {/* Information Alert */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Note:</strong> Automatic backups will only work when the application is open in your browser. 
              For production environments, consider setting up server-side backup schedules.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettingsComponent;