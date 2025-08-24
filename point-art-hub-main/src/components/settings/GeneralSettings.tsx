import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/contexts/SettingsContext';
import BackupSettingsComponent from './BackupSettings';
import NotificationSettingsComponent from './NotificationSettings';
import { 
  Settings, 
  Bell, 
  Building, 
  Monitor, 
  Save, 
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Globe,
  Clock,
  DollarSign,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GeneralSettings = () => {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // Update local settings when global settings change
  React.useEffect(() => {
    setLocalSettings(settings);
    setHasUnsavedChanges(false);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    await updateSettings(localSettings);
    setHasUnsavedChanges(false);
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      await resetSettings();
      setHasUnsavedChanges(false);
    }
  };

  const handleDiscard = () => {
    setLocalSettings(settings);
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Unsaved changes banner */}
      {hasUnsavedChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDiscard}>
                  Discard
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8">
        {/* Application Preferences */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-green-600 text-white rounded-lg">
                <Settings className="h-5 w-5" />
              </div>
              Application Preferences
            </CardTitle>
            <CardDescription>
              Configure general application behavior and display settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Currency
                </Label>
                <Select 
                  value={localSettings.currency} 
                  onValueChange={(value) => handleChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UGX">Ugandan Shilling (UGX)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <Select 
                  value={localSettings.language} 
                  onValueChange={(value) => handleChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                    <SelectItem value="lg">Luganda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select 
                  value={localSettings.dateFormat} 
                  onValueChange={(value) => handleChange('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeFormat" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Format
                </Label>
                <Select 
                  value={localSettings.timeFormat} 
                  onValueChange={(value) => handleChange('timeFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  max="100"
                  value={localSettings.lowStockThreshold}
                  onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Alert when items have fewer than this many units in stock
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refreshInterval" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Dashboard Refresh Interval (seconds)
                </Label>
                <Select 
                  value={localSettings.refreshInterval.toString()} 
                  onValueChange={(value) => handleChange('refreshInterval', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Display Options</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showWelcomeMessage">Show Welcome Message</Label>
                    <p className="text-sm text-muted-foreground">
                      Display welcome message on dashboard
                    </p>
                  </div>
                  <Switch
                    id="showWelcomeMessage"
                    checked={localSettings.showWelcomeMessage}
                    onCheckedChange={(checked) => handleChange('showWelcomeMessage', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compactMode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use compact layout to show more data
                    </p>
                  </div>
                  <Switch
                    id="compactMode"
                    checked={localSettings.compactMode}
                    onCheckedChange={(checked) => handleChange('compactMode', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg">
                <Bell className="h-5 w-5" />
              </div>
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={localSettings.emailNotifications}
                onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when inventory is running low
                </p>
              </div>
              <Switch
                id="lowStockAlerts"
                checked={localSettings.lowStockAlerts}
                onCheckedChange={(checked) => handleChange('lowStockAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="salesMilestoneAlerts">Sales Milestone Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate when you reach sales goals
                </p>
              </div>
              <Switch
                id="salesMilestoneAlerts"
                checked={localSettings.salesMilestoneAlerts}
                onCheckedChange={(checked) => handleChange('salesMilestoneAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="systemMaintenanceAlerts">System Maintenance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Important system updates and maintenance notices
                </p>
              </div>
              <Switch
                id="systemMaintenanceAlerts"
                checked={localSettings.systemMaintenanceAlerts}
                onCheckedChange={(checked) => handleChange('systemMaintenanceAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg">
                <Building className="h-5 w-5" />
              </div>
              Business Information
            </CardTitle>
            <CardDescription>
              Update your business details for invoices and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={localSettings.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={localSettings.businessEmail}
                  onChange={(e) => handleChange('businessEmail', e.target.value)}
                  placeholder="business@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Business Phone
                </Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={localSettings.businessPhone}
                  onChange={(e) => handleChange('businessPhone', e.target.value)}
                  placeholder="+256 XXX XXXXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={localSettings.taxRate}
                  onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                value={localSettings.businessAddress}
                onChange={(e) => handleChange('businessAddress', e.target.value)}
                placeholder="Enter your complete business address..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <NotificationSettingsComponent />

        {/* Backup Settings */}
        <BackupSettingsComponent />

        {/* Action Buttons */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-3">
                <Button 
                  onClick={handleSave} 
                  disabled={!hasUnsavedChanges}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                {hasUnsavedChanges && (
                  <Button variant="outline" onClick={handleDiscard}>
                    Discard Changes
                  </Button>
                )}
              </div>
              <Button 
                variant="destructive" 
                onClick={handleReset}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeneralSettings;