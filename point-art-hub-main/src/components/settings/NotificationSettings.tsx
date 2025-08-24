import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendTestNotification,
  initializeNotificationSystem,
  generateLowStockNotifications,
  generateSalesMilestoneNotifications,
  type NotificationSettings
} from '@/utils/notificationUtils';
import {
  Bell,
  Mail,
  AlertTriangle,
  Target,
  Settings as SettingsIcon,
  CheckCircle,
  TestTube,
  Volume2,
  Clock,
  Package
} from 'lucide-react';

const NotificationSettingsComponent = () => {
  const { toast } = useToast();
  const { isAdmin } = useUser();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    lowStockThreshold: 10,
    lowStockAlerts: true,
    salesMilestoneAlerts: true,
    systemMaintenanceAlerts: true,
    dailyReports: false,
    weeklyReports: false,
    monthlyReports: false,
    emailAddress: '',
    notificationFrequency: 'immediate'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = getNotificationSettings();
    setSettings(loadedSettings);
    
    // Check browser notification permission
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      saveNotificationSettings(settings);
      
      // Initialize notification system with new settings
      if (settings.lowStockAlerts || settings.salesMilestoneAlerts) {
        await initializeNotificationSystem();
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Notification settings have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save notification settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      emailEnabled: false,
      lowStockThreshold: 10,
      lowStockAlerts: true,
      salesMilestoneAlerts: true,
      systemMaintenanceAlerts: true,
      dailyReports: false,
      weeklyReports: false,
      monthlyReports: false,
      emailAddress: '',
      notificationFrequency: 'immediate'
    });
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setBrowserPermission(granted ? 'granted' : 'denied');
    
    if (granted) {
      toast({
        title: 'Permission Granted',
        description: 'Browser notifications are now enabled',
      });
    } else {
      toast({
        title: 'Permission Denied',
        description: 'Browser notifications have been disabled',
        variant: 'destructive',
      });
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
    toast({
      title: 'Test Notification Sent',
      description: 'Check the notification center for the test notification',
    });
  };

  const handleTestLowStock = async () => {
    await generateLowStockNotifications();
    toast({
      title: 'Low Stock Check Completed',
      description: 'Low stock notifications have been generated if any items are running low',
    });
  };

  const handleTestSalesMilestone = async () => {
    await generateSalesMilestoneNotifications();
    toast({
      title: 'Sales Milestone Check Completed',
      description: 'Sales milestone notifications have been checked and generated if applicable',
    });
  };

  const handleTestEmail = async () => {
    if (!settings.emailAddress) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address first',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingEmail(true);
    try {
      // Simulate email test - in a real app, this would send an actual email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Test Email Sent',
        description: `Test email sent to ${settings.emailAddress} (simulated)`,
      });
    } catch (error) {
      toast({
        title: 'Email Test Failed',
        description: 'Failed to send test email. Please check your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const getPermissionStatus = () => {
    switch (browserPermission) {
      case 'granted':
        return { color: 'text-green-600', text: 'Enabled', icon: <CheckCircle className="h-4 w-4" /> };
      case 'denied':
        return { color: 'text-red-600', text: 'Blocked', icon: <AlertTriangle className="h-4 w-4" /> };
      default:
        return { color: 'text-orange-600', text: 'Not Requested', icon: <Bell className="h-4 w-4" /> };
    }
  };

  const permissionStatus = getPermissionStatus();

  return (
    <div className="space-y-6">
      {/* Browser Notifications */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <Volume2 className="h-5 w-5" />
            </div>
            Browser Notifications
          </CardTitle>
          <CardDescription>
            Enable browser notifications to receive real-time alerts even when the app is minimized
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={permissionStatus.color}>
                {permissionStatus.icon}
              </div>
              <div>
                <p className="font-medium">Browser Permission Status</p>
                <p className={`text-sm ${permissionStatus.color}`}>
                  {permissionStatus.text}
                </p>
              </div>
            </div>
            
            {browserPermission !== 'granted' && (
              <Button
                onClick={handleRequestPermission}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Enable Notifications
              </Button>
            )}
            
            {browserPermission === 'granted' && (
              <Button
                variant="outline"
                onClick={handleTestNotification}
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}
          </div>

          {browserPermission === 'denied' && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Browser notifications are blocked. To enable them, click the notification icon in your browser's address bar or check your browser settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg">
              <Mail className="h-5 w-5" />
            </div>
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email notifications for important events and reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, emailEnabled: checked }))
              }
            />
          </div>

          {settings.emailEnabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
              <div className="space-y-2">
                <Label htmlFor="email-address">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="email-address"
                    type="email"
                    value={settings.emailAddress}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, emailAddress: e.target.value }))
                    }
                    placeholder="your-email@example.com"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={!settings.emailAddress || isTestingEmail}
                  >
                    {isTestingEmail ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-b-2 border-blue-500 rounded-full mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-frequency">Email Frequency</Label>
                <Select 
                  value={settings.notificationFrequency} 
                  onValueChange={(value: 'immediate' | 'hourly' | 'daily') => 
                    setSettings(prev => ({ ...prev, notificationFrequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly Digest</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Note:</strong> Email functionality requires server-side configuration. 
                  This is currently simulated for demonstration purposes.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Preferences */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Alert Preferences
          </CardTitle>
          <CardDescription>
            Configure which types of alerts you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="low-stock-alerts" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Low Stock Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when inventory is running low
                </p>
              </div>
              <Switch
                id="low-stock-alerts"
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, lowStockAlerts: checked }))
                }
              />
            </div>

            {settings.lowStockAlerts && (
              <div className="space-y-3 pl-6 border-l-2 border-orange-200">
                <div className="space-y-2">
                  <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="low-stock-threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={settings.lowStockThreshold}
                      onChange={(e) => 
                        setSettings(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || 10 }))
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">items or less</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestLowStock}
                      className="ml-auto"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sales Milestone Alerts */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sales-milestone-alerts" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Sales Milestone Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate when you reach sales goals
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="sales-milestone-alerts"
                  checked={settings.salesMilestoneAlerts}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, salesMilestoneAlerts: checked }))
                  }
                />
                {settings.salesMilestoneAlerts && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestSalesMilestone}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* System Maintenance Alerts */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="system-maintenance-alerts" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                System Maintenance Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Important system updates and maintenance notices
              </p>
            </div>
            <Switch
              id="system-maintenance-alerts"
              checked={settings.systemMaintenanceAlerts}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, systemMaintenanceAlerts: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Notifications */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            Report Notifications
          </CardTitle>
          <CardDescription>
            Automatically receive regular business reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-reports">Daily Reports</Label>
              <p className="text-sm text-muted-foreground">
                Daily sales summary and inventory status
              </p>
            </div>
            <Switch
              id="daily-reports"
              checked={settings.dailyReports}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, dailyReports: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Weekly performance analysis and trends
              </p>
            </div>
            <Switch
              id="weekly-reports"
              checked={settings.weeklyReports}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, weeklyReports: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthly-reports">Monthly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Comprehensive monthly business insights
              </p>
            </div>
            <Switch
              id="monthly-reports"
              checked={settings.monthlyReports}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, monthlyReports: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
        >
          {isSaving ? (
            <>
              <SettingsIcon className="h-4 w-4 mr-2 animate-spin" />
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
    </div>
  );
};

export default NotificationSettingsComponent;