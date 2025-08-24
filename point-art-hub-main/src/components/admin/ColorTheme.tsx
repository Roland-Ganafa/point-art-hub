import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, RefreshCw, Sparkles, Sun, Moon, Zap, Heart, Leaf, ArrowLeft, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ColorThemeProps {
  onThemeUpdate?: (theme: string) => void;
}

const ColorTheme = ({ onThemeUpdate }: ColorThemeProps) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBackToMain = () => {
    navigate('/');
  };

  // Predefined theme configurations
  const themes = [
    {
      id: 'default',
      name: 'Default Blue',
      description: 'Classic blue gradient theme',
      icon: Palette,
      primary: 'from-blue-500 to-purple-600',
      secondary: 'from-blue-50 to-purple-50',
      accent: 'blue-500',
      preview: {
        bg: 'bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50',
        card: 'bg-gradient-to-r from-blue-500 to-purple-600',
        text: 'text-blue-600'
      }
    },
    {
      id: 'emerald',
      name: 'Emerald Fresh',
      description: 'Fresh green nature theme',
      icon: Leaf,
      primary: 'from-emerald-500 to-teal-600',
      secondary: 'from-emerald-50 to-teal-50',
      accent: 'emerald-500',
      preview: {
        bg: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50',
        card: 'bg-gradient-to-r from-emerald-500 to-teal-600',
        text: 'text-emerald-600'
      }
    },
    {
      id: 'sunset',
      name: 'Sunset Orange',
      description: 'Warm sunset gradient theme',
      icon: Sun,
      primary: 'from-orange-500 to-red-600',
      secondary: 'from-orange-50 to-red-50',
      accent: 'orange-500',
      preview: {
        bg: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
        card: 'bg-gradient-to-r from-orange-500 to-red-600',
        text: 'text-orange-600'
      }
    },
    {
      id: 'cosmic',
      name: 'Cosmic Purple',
      description: 'Deep space purple theme',
      icon: Sparkles,
      primary: 'from-purple-600 to-indigo-700',
      secondary: 'from-purple-50 to-indigo-50',
      accent: 'purple-600',
      preview: {
        bg: 'bg-gradient-to-br from-purple-50 via-indigo-50 to-violet-50',
        card: 'bg-gradient-to-r from-purple-600 to-indigo-700',
        text: 'text-purple-600'
      }
    },
    {
      id: 'rose',
      name: 'Rose Garden',
      description: 'Elegant rose pink theme',
      icon: Heart,
      primary: 'from-rose-500 to-pink-600',
      secondary: 'from-rose-50 to-pink-50',
      accent: 'rose-500',
      preview: {
        bg: 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50',
        card: 'bg-gradient-to-r from-rose-500 to-pink-600',
        text: 'text-rose-600'
      }
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Professional dark theme',
      icon: Moon,
      primary: 'from-gray-800 to-slate-900',
      secondary: 'from-gray-50 to-slate-50',
      accent: 'gray-800',
      preview: {
        bg: 'bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50',
        card: 'bg-gradient-to-r from-gray-800 to-slate-900',
        text: 'text-gray-800'
      }
    },
    {
      id: 'electric',
      name: 'Electric Blue',
      description: 'High-energy electric theme',
      icon: Zap,
      primary: 'from-cyan-500 to-blue-600',
      secondary: 'from-cyan-50 to-blue-50',
      accent: 'cyan-500',
      preview: {
        bg: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50',
        card: 'bg-gradient-to-r from-cyan-500 to-blue-600',
        text: 'text-cyan-600'
      }
    }
  ];

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleApplyTheme = async () => {
    setIsApplying(true);
    try {
      // Save theme to localStorage
      localStorage.setItem('selectedTheme', selectedTheme);
      localStorage.setItem('themeConfig', JSON.stringify(themes.find(t => t.id === selectedTheme)));
      
      // Call the callback if provided
      onThemeUpdate?.(selectedTheme);
      
      toast({
        title: "🎨 Theme Applied Successfully!",
        description: `Your new ${themes.find(t => t.id === selectedTheme)?.name} theme has been saved.`,
        duration: 5000,
      });
      
    } catch (error) {
      toast({
        title: "Theme Application Failed",
        description: "There was an error applying your theme. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleResetTheme = () => {
    localStorage.removeItem('selectedTheme');
    localStorage.removeItem('themeConfig');
    setSelectedTheme('default');
    onThemeUpdate?.('default');
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default.",
      duration: 5000,
    });
  };

  const currentTheme = themes.find(t => t.id === selectedTheme) || themes[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-pink-200/30 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-6 mb-6">
            <Button 
              variant="outline" 
              onClick={handleBackToMain}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 hover:scale-105 transition-all duration-200 hover:shadow-lg px-6 py-2.5 whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main Page
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                Settings & Customization
              </h1>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
                <p className="text-gray-600 text-lg font-medium">Configure your Point Art Hub experience with personalized branding and themes</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="font-medium">Theme Customization</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="font-medium">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-pink-500 flex-shrink-0" />
              <span className="font-medium">Advanced Options</span>
            </div>
          </div>
        </div>

    <div className="space-y-8">
      {/* Theme Preview */}
      <Card className="border-0 shadow-2xl overflow-hidden">
        <CardHeader className={`${currentTheme.preview.bg} transition-all duration-500`}>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className={`p-3 ${currentTheme.preview.card} text-white rounded-xl shadow-lg`}>
              <Palette className="h-6 w-6" />
            </div>
            Live Theme Preview
          </CardTitle>
          <CardDescription className="text-lg">
            See how your selected theme will look
          </CardDescription>
        </CardHeader>
        <CardContent className={`${currentTheme.preview.bg} p-8 transition-all duration-500`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sample Dashboard Card */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${currentTheme.preview.card} text-white rounded-lg`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sample Module</CardTitle>
                    <CardDescription>Preview how cards look</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${currentTheme.preview.text}`}>42</div>
                <p className="text-sm text-muted-foreground">Total items</p>
              </CardContent>
            </Card>

            {/* Sample Button */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6 space-y-4">
                <h4 className="font-semibold">Interactive Elements</h4>
                <Button className={`${currentTheme.preview.card} text-white hover:scale-105 transition-all duration-200 shadow-lg w-full`}>
                  Sample Button
                </Button>
                <Badge variant="outline" className={`${currentTheme.preview.text} border-current`}>
                  Sample Badge
                </Badge>
              </CardContent>
            </Card>

            {/* Sample Stats */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4">Sample Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Sales</span>
                    <span className={`font-bold ${currentTheme.preview.text}`}>UGX 1,250,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${currentTheme.preview.card} h-full rounded-full transition-all duration-1000`} style={{ width: '65%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection Grid */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Palette className="h-6 w-6 text-blue-600" />
            Choose Your Theme
          </CardTitle>
          <CardDescription>
            Select a color theme that matches your brand and style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {themes.map((theme) => {
              const Icon = theme.icon;
              const isSelected = selectedTheme === theme.id;
              return (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
                    isSelected 
                      ? 'border-blue-500 shadow-xl ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 ${theme.preview.card} text-white rounded-xl shadow-lg`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {isSelected && (
                        <div className="p-1 bg-blue-500 text-white rounded-full">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{theme.name}</CardTitle>
                    <CardDescription className="text-sm">{theme.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`${theme.preview.bg} p-4 rounded-lg space-y-2`}>
                      <div className="flex gap-2">
                        <div className={`w-8 h-2 ${theme.preview.card} rounded-full`}></div>
                        <div className={`w-6 h-2 ${theme.preview.card} rounded-full opacity-70`}></div>
                        <div className={`w-4 h-2 ${theme.preview.card} rounded-full opacity-50`}></div>
                      </div>
                      <div className="text-xs text-gray-600">Theme preview</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleApplyTheme}
          disabled={isApplying}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex-1 md:flex-none"
        >
          {isApplying ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Applying Theme...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Apply {currentTheme.name} Theme
            </div>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleResetTheme}
          className="hover:scale-105 transition-all duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>

      {/* Theme Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Theme Customization Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Themes are automatically saved and will persist across sessions</li>
                <li>• The preview shows how your dashboard will look with the selected theme</li>
                <li>• Choose themes that align with your brand colors for consistency</li>
                <li>• Dark mode is perfect for low-light environments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
      </div>
    </div>
  );
};

export default ColorTheme;