import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppSettings {
  // General Preferences
  lowStockThreshold: number;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  
  // Notifications
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  salesMilestoneAlerts: boolean;
  systemMaintenanceAlerts: boolean;
  
  // Business Settings
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  taxRate: number;
  
  // Dashboard Settings
  refreshInterval: number;
  defaultModule: string;
  showWelcomeMessage: boolean;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  lowStockThreshold: 5,
  currency: 'UGX',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  language: 'en',
  emailNotifications: true,
  lowStockAlerts: true,
  salesMilestoneAlerts: true,
  systemMaintenanceAlerts: true,
  businessName: 'Point Art Hub',
  businessEmail: '',
  businessPhone: '',
  businessAddress: '',
  taxRate: 0,
  refreshInterval: 30,
  defaultModule: 'overview',
  showWelcomeMessage: true,
  compactMode: false,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from localStorage first (for quick loading)
      const savedSettings = localStorage.getItem('pointArtHubSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
      
      // TODO: In future, load from database for multi-user settings
      // const { data, error } = await supabase
      //   .from('app_settings')
      //   .select('*')
      //   .single();
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Settings Load Error',
        description: 'Using default settings. Your preferences may not be saved.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save to localStorage immediately
      localStorage.setItem('pointArtHubSettings', JSON.stringify(updatedSettings));
      
      // TODO: In future, save to database for multi-user settings
      // await supabase
      //   .from('app_settings')
      //   .upsert(updatedSettings);
      
      toast({
        title: 'Settings Updated',
        description: 'Your preferences have been saved successfully.',
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      localStorage.setItem('pointArtHubSettings', JSON.stringify(DEFAULT_SETTINGS));
      
      toast({
        title: 'Settings Reset',
        description: 'All settings have been restored to defaults.',
      });
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Reset Error',
        description: 'Failed to reset settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};