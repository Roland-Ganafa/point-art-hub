import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Bell, HardDrive, Building, Save, CheckCircle } from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import BackupSettings from '@/components/settings/BackupSettings';

const BUSINESS_KEY = "point-art-business-settings";

interface BusinessSettings {
  business_name: string;
  address: string;
  phone: string;
  email: string;
  tin: string;
  currency: string;
  website: string;
}

const DEFAULT_BUSINESS: BusinessSettings = {
  business_name: "Point Art Hub",
  address: "",
  phone: "",
  email: "",
  tin: "",
  currency: "UGX",
  website: "",
};

const SettingsPage = () => {
  const [business, setBusiness] = useState<BusinessSettings>(() => {
    try { const s = localStorage.getItem(BUSINESS_KEY); return s ? JSON.parse(s) : DEFAULT_BUSINESS; } catch { return DEFAULT_BUSINESS; }
  });
  const [saved, setSaved] = useState(false);

  const saveBusiness = () => {
    try {
      localStorage.setItem(BUSINESS_KEY, JSON.stringify(business));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application preferences and configuration
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-lg">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="backup" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger 
            value="business" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <Building className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Manage your data backup and restore settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Your business details used on invoices, reports, and exports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {saved && (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 rounded-lg px-4 py-2 text-sm">
                  <CheckCircle className="h-4 w-4" /> Business settings saved successfully.
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input value={business.business_name} onChange={e => setBusiness(b => ({ ...b, business_name: e.target.value }))} placeholder="Point Art Hub" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input value={business.phone} onChange={e => setBusiness(b => ({ ...b, phone: e.target.value }))} placeholder="+256 700 000000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" value={business.email} onChange={e => setBusiness(b => ({ ...b, email: e.target.value }))} placeholder="info@pointarthub.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input value={business.website} onChange={e => setBusiness(b => ({ ...b, website: e.target.value }))} placeholder="www.pointarthub.com" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Business Address</Label>
                  <Input value={business.address} onChange={e => setBusiness(b => ({ ...b, address: e.target.value }))} placeholder="Street, City, Country" />
                </div>
                <div className="space-y-1.5">
                  <Label>TIN / Tax ID</Label>
                  <Input value={business.tin} onChange={e => setBusiness(b => ({ ...b, tin: e.target.value }))} placeholder="1234567890" />
                </div>
                <div className="space-y-1.5">
                  <Label>Default Currency</Label>
                  <Select value={business.currency} onValueChange={v => setBusiness(b => ({ ...b, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX — Ugandan Shilling</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="TZS">TZS — Tanzanian Shilling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveBusiness} className="bg-primary hover:bg-primary/90">
                <Save className="h-4 w-4 mr-2" /> Save Business Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;