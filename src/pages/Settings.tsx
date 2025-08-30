import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Palette, Upload } from 'lucide-react';
import LogoUpload from '@/components/admin/LogoUpload';
import ColorTheme from '@/components/admin/ColorTheme';
import GeneralSettings from '@/components/settings/GeneralSettings';
import AdvancedSettings from '@/components/settings/AdvancedSettings';

const SettingsPage = () => {
  const handleLogoUpdate = (logoUrl: string) => {
    // Instead of full page reload, just update the UI
    // The Logo component will automatically detect changes in localStorage
    console.log("Logo updated:", logoUrl);
  };

  const handleThemeUpdate = (theme: string) => {
    // Handle theme update - could trigger a page refresh or state update
    console.log('Theme updated to:', theme);
    // For now, just log the theme change
    // In the future, this could update a global theme context
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-2xl flex items-center justify-center">
          <Settings className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Settings & Customization
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Configure your Point Art Hub experience with personalized branding and themes
          </p>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl rounded-xl p-2 mx-auto max-w-2xl">
          <TabsTrigger 
            value="branding" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg"
          >
            <Palette className="w-4 h-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger 
            value="general" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg"
          >
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300 hover:scale-105 rounded-lg"
          >
            <Upload className="w-4 h-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="grid gap-6">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg">
                    <Palette className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">✨ Branding & Theme Customization</h3>
                    <p className="text-gray-600 mb-4">
                      Personalize your Point Art Hub with custom logos and beautiful color themes. 
                      All changes are automatically saved and will persist across your sessions.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Live theme preview</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>7 beautiful themes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Custom logo support</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Automatic persistence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                    <Upload className="h-5 w-5" />
                  </div>
                  Company Branding
                </CardTitle>
                <CardDescription>
                  Upload your company logo and customize your brand identity
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LogoUpload onLogoUpdate={handleLogoUpdate} />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-3">
                  <Palette className="h-6 w-6 text-purple-600" />
                  Color Theme
                </CardTitle>
                <CardDescription>
                  Customize the application color scheme with live preview
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ColorTheme onThemeUpdate={handleThemeUpdate} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <AdvancedSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;