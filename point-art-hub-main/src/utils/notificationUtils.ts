import { supabase } from '@/integrations/supabase/client';

export interface NotificationSettings {
  emailEnabled: boolean;
  lowStockThreshold: number;
  lowStockAlerts: boolean;
  salesMilestoneAlerts: boolean;
  systemMaintenanceAlerts: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  emailAddress: string;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
}

export interface NotificationEvent {
  id: string;
  type: 'low_stock' | 'sales_milestone' | 'system_event' | 'backup_reminder' | 'report';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  read: boolean;
  data?: any;
}

export interface LowStockItem {
  id: string;
  item_name: string;
  current_stock: number;
  min_stock_level: number;
  category: string;
  module: 'stationery' | 'gift_store';
}

export interface SalesMilestone {
  type: 'daily_target' | 'weekly_target' | 'monthly_target' | 'revenue_milestone';
  target: number;
  achieved: number;
  percentage: number;
  period: string;
}

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
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
};

/**
 * Get notification settings from localStorage
 */
export const getNotificationSettings = (): NotificationSettings => {
  try {
    const settings = localStorage.getItem('notification_settings');
    return settings ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(settings) } : DEFAULT_NOTIFICATION_SETTINGS;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
};

/**
 * Save notification settings to localStorage
 */
export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem('notification_settings', JSON.stringify(settings));
};

/**
 * Get notifications from localStorage
 */
export const getNotifications = (): NotificationEvent[] => {
  try {
    const notifications = localStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : [];
  } catch {
    return [];
  }
};

/**
 * Add a new notification
 */
export const addNotification = (notification: Omit<NotificationEvent, 'id' | 'created_at' | 'read'>): NotificationEvent => {
  const newNotification: NotificationEvent = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    read: false
  };

  const notifications = getNotifications();
  const updatedNotifications = [newNotification, ...notifications].slice(0, 100); // Keep last 100 notifications
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));

  // Trigger browser notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.type
    });
  }

  return newNotification;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (notificationId: string): void => {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notif => 
    notif.id === notificationId ? { ...notif, read: true } : notif
  );
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = (): void => {
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }));
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = (): void => {
  localStorage.removeItem('notifications');
};

/**
 * Check for low stock items
 */
export const checkLowStockItems = async (): Promise<LowStockItem[]> => {
  const settings = getNotificationSettings();
  const lowStockItems: LowStockItem[] = [];

  try {
    // Check stationery items
    const { data: stationeryData } = await supabase
      .from('stationery' as any)
      .select('id, item_name, stock_quantity, min_stock_level, category')
      .lte('stock_quantity', settings.lowStockThreshold);

    if (stationeryData) {
      stationeryData.forEach((item: any) => {
        if (item.stock_quantity <= (item.min_stock_level || settings.lowStockThreshold)) {
          lowStockItems.push({
            id: item.id,
            item_name: item.item_name,
            current_stock: item.stock_quantity,
            min_stock_level: item.min_stock_level || settings.lowStockThreshold,
            category: item.category,
            module: 'stationery'
          });
        }
      });
    }

    // Check gift store items
    const { data: giftStoreData } = await supabase
      .from('gift_store' as any)
      .select('id, item_name, stock_quantity, category')
      .lte('stock_quantity', settings.lowStockThreshold);

    if (giftStoreData) {
      giftStoreData.forEach((item: any) => {
        if (item.stock_quantity <= settings.lowStockThreshold) {
          lowStockItems.push({
            id: item.id,
            item_name: item.item_name,
            current_stock: item.stock_quantity,
            min_stock_level: settings.lowStockThreshold,
            category: item.category,
            module: 'gift_store'
          });
        }
      });
    }

  } catch (error) {
    console.error('Error checking low stock items:', error);
  }

  return lowStockItems;
};

/**
 * Generate low stock notifications
 */
export const generateLowStockNotifications = async (): Promise<void> => {
  const settings = getNotificationSettings();
  
  if (!settings.lowStockAlerts) {
    return;
  }

  const lowStockItems = await checkLowStockItems();
  
  if (lowStockItems.length > 0) {
    // Group by module for better organization
    const stationeryItems = lowStockItems.filter(item => item.module === 'stationery');
    const giftStoreItems = lowStockItems.filter(item => item.module === 'gift_store');

    if (stationeryItems.length > 0) {
      addNotification({
        type: 'low_stock',
        title: `⚠️ Low Stock Alert - Stationery`,
        message: `${stationeryItems.length} stationery items are running low: ${stationeryItems.slice(0, 3).map(item => item.item_name).join(', ')}${stationeryItems.length > 3 ? ` and ${stationeryItems.length - 3} more` : ''}`,
        priority: 'high',
        data: { items: stationeryItems, module: 'stationery' }
      });
    }

    if (giftStoreItems.length > 0) {
      addNotification({
        type: 'low_stock',
        title: `⚠️ Low Stock Alert - Gift Store`,
        message: `${giftStoreItems.length} gift store items are running low: ${giftStoreItems.slice(0, 3).map(item => item.item_name).join(', ')}${giftStoreItems.length > 3 ? ` and ${giftStoreItems.length - 3} more` : ''}`,
        priority: 'high',
        data: { items: giftStoreItems, module: 'gift_store' }
      });
    }
  }
};

/**
 * Check sales milestones
 */
export const checkSalesMilestones = async (): Promise<SalesMilestone[]> => {
  const milestones: SalesMilestone[] = [];

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Daily sales target (example: 500,000 UGX)
    const { data: dailySales } = await supabase
      .from('stationery_sales' as any)
      .select('total_amount')
      .gte('created_at', startOfDay.toISOString());

    const dailyTotal = dailySales?.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0) || 0;
    const dailyTarget = 500000; // 500k UGX daily target

    if (dailyTotal >= dailyTarget) {
      milestones.push({
        type: 'daily_target',
        target: dailyTarget,
        achieved: dailyTotal,
        percentage: (dailyTotal / dailyTarget) * 100,
        period: 'today'
      });
    }

    // Weekly sales target (example: 3,000,000 UGX)
    const { data: weeklySales } = await supabase
      .from('stationery_sales' as any)
      .select('total_amount')
      .gte('created_at', startOfWeek.toISOString());

    const weeklyTotal = weeklySales?.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0) || 0;
    const weeklyTarget = 3000000; // 3M UGX weekly target

    if (weeklyTotal >= weeklyTarget) {
      milestones.push({
        type: 'weekly_target',
        target: weeklyTarget,
        achieved: weeklyTotal,
        percentage: (weeklyTotal / weeklyTarget) * 100,
        period: 'this week'
      });
    }

    // Monthly sales target (example: 12,000,000 UGX)
    const { data: monthlySales } = await supabase
      .from('stationery_sales' as any)
      .select('total_amount')
      .gte('created_at', startOfMonth.toISOString());

    const monthlyTotal = monthlySales?.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0) || 0;
    const monthlyTarget = 12000000; // 12M UGX monthly target

    if (monthlyTotal >= monthlyTarget) {
      milestones.push({
        type: 'monthly_target',
        target: monthlyTarget,
        achieved: monthlyTotal,
        percentage: (monthlyTotal / monthlyTarget) * 100,
        period: 'this month'
      });
    }

    // Revenue milestones (1M, 5M, 10M, etc.)
    const revenueMilestones = [1000000, 5000000, 10000000, 20000000, 50000000];
    const { data: totalSales } = await supabase
      .from('stationery_sales' as any)
      .select('total_amount');

    const totalRevenue = totalSales?.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0) || 0;
    
    for (const milestone of revenueMilestones) {
      if (totalRevenue >= milestone) {
        const lastChecked = localStorage.getItem(`milestone_${milestone}_checked`);
        if (!lastChecked || new Date(lastChecked).toDateString() !== today.toDateString()) {
          milestones.push({
            type: 'revenue_milestone',
            target: milestone,
            achieved: totalRevenue,
            percentage: (totalRevenue / milestone) * 100,
            period: 'lifetime'
          });
          localStorage.setItem(`milestone_${milestone}_checked`, today.toISOString());
        }
      }
    }

  } catch (error) {
    console.error('Error checking sales milestones:', error);
  }

  return milestones;
};

/**
 * Generate sales milestone notifications
 */
export const generateSalesMilestoneNotifications = async (): Promise<void> => {
  const settings = getNotificationSettings();
  
  if (!settings.salesMilestoneAlerts) {
    return;
  }

  const milestones = await checkSalesMilestones();
  
  milestones.forEach(milestone => {
    const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;
    
    let title = '';
    let message = '';
    
    switch (milestone.type) {
      case 'daily_target':
        title = '🎯 Daily Sales Target Achieved!';
        message = `Congratulations! You've reached today's sales target of ${formatCurrency(milestone.target)}. Total sales: ${formatCurrency(milestone.achieved)}`;
        break;
      case 'weekly_target':
        title = '🏆 Weekly Sales Target Achieved!';
        message = `Amazing! You've hit this week's sales target of ${formatCurrency(milestone.target)}. Total sales: ${formatCurrency(milestone.achieved)}`;
        break;
      case 'monthly_target':
        title = '🌟 Monthly Sales Target Achieved!';
        message = `Outstanding! You've reached this month's sales target of ${formatCurrency(milestone.target)}. Total sales: ${formatCurrency(milestone.achieved)}`;
        break;
      case 'revenue_milestone':
        title = '💰 Revenue Milestone Reached!';
        message = `Incredible! You've reached a major revenue milestone of ${formatCurrency(milestone.target)}. Total lifetime revenue: ${formatCurrency(milestone.achieved)}`;
        break;
    }

    addNotification({
      type: 'sales_milestone',
      title,
      message,
      priority: 'medium',
      data: milestone
    });
  });
};

/**
 * Generate system event notifications
 */
export const generateSystemEventNotification = (
  title: string,
  message: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  data?: any
): void => {
  addNotification({
    type: 'system_event',
    title,
    message,
    priority,
    data
  });
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

/**
 * Initialize notification system
 */
export const initializeNotificationSystem = async (): Promise<void> => {
  // Request browser notification permission
  await requestNotificationPermission();
  
  // Set up periodic checks
  const settings = getNotificationSettings();
  
  if (settings.lowStockAlerts) {
    // Check for low stock items every hour
    setInterval(generateLowStockNotifications, 60 * 60 * 1000);
    // Initial check
    generateLowStockNotifications();
  }
  
  if (settings.salesMilestoneAlerts) {
    // Check for sales milestones every 30 minutes
    setInterval(generateSalesMilestoneNotifications, 30 * 60 * 1000);
    // Initial check
    generateSalesMilestoneNotifications();
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = (): void => {
  addNotification({
    type: 'system_event',
    title: '🧪 Test Notification',
    message: 'This is a test notification to verify your notification system is working correctly.',
    priority: 'low',
    data: { test: true, timestamp: new Date().toISOString() }
  });
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = (): number => {
  const notifications = getNotifications();
  return notifications.filter(notif => !notif.read).length;
};

/**
 * Generate backup reminder notification
 */
export const generateBackupReminderNotification = (): void => {
  const lastBackup = localStorage.getItem('last_backup_date');
  const daysSinceBackup = lastBackup ? 
    Math.floor((Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24)) : 
    999;

  if (daysSinceBackup >= 7) {
    addNotification({
      type: 'backup_reminder',
      title: '🗄️ Backup Reminder',
      message: `It's been ${daysSinceBackup} days since your last backup. Consider creating a backup to protect your data.`,
      priority: 'medium',
      data: { daysSinceBackup, lastBackup }
    });
  }
};