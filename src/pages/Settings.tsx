import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Bell, HardDrive, Building } from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import BackupSettings from '@/components/settings/BackupSettings';

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your application preferences and configuration
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-1 shadow-lg">
          <TabsTrigger 
            value="general" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="backup" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger 
            value="business" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg"
          >
            <Building className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 animate-in fade-in-50 duration-300">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
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
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
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
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Update your business details for invoices and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Business settings are managed in the General tab.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;