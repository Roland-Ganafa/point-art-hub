import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { format } from 'date-fns';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  getUnreadNotificationCount,
  sendTestNotification,
  type NotificationEvent
} from '@/utils/notificationUtils';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Target,
  Package,
  Settings,
  Archive,
  TestTube,
  RefreshCw
} from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'low_stock' | 'sales_milestone' | 'system_event'>('all');
  const { toast } = useToast();
  const { isAdmin } = useUser();

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(getUnreadNotificationCount());
  };

  useEffect(() => {
    loadNotifications();
    
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    loadNotifications();
    toast({
      title: 'Notification Marked as Read',
      description: 'The notification has been marked as read.',
    });
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    loadNotifications();
    toast({
      title: 'All Notifications Read',
      description: 'All notifications have been marked as read.',
    });
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      clearAllNotifications();
      loadNotifications();
      toast({
        title: 'Notifications Cleared',
        description: 'All notifications have been cleared.',
      });
    }
  };

  const handleSendTest = () => {
    sendTestNotification();
    loadNotifications();
    toast({
      title: 'Test Notification Sent',
      description: 'A test notification has been added to verify the system.',
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Package className="h-4 w-4 text-orange-500" />;
      case 'sales_milestone':
        return <Target className="h-4 w-4 text-green-500" />;
      case 'system_event':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'backup_reminder':
        return <Archive className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const getFilterLabel = (filterType: string) => {
    switch (filterType) {
      case 'all':
        return 'All Notifications';
      case 'unread':
        return 'Unread';
      case 'low_stock':
        return 'Low Stock';
      case 'sales_milestone':
        return 'Sales Milestones';
      case 'system_event':
        return 'System Events';
      default:
        return 'All Notifications';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            Notification Center
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Stay updated with low stock alerts, sales milestones, and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'unread', 'low_stock', 'sales_milestone', 'system_event'] as const).map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(filterType)}
                  className={filter === filterType ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
                >
                  {getFilterLabel(filterType)}
                  {filterType === 'unread' && unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotifications}
                className="bg-white/80"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTest}
                  className="bg-white/80"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test
                </Button>
              )}
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {getFilterLabel(filter)} ({filteredNotifications.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread' 
                  ? 'All caught up! Check back later for new notifications.'
                  : 'You don\'t have any notifications yet. They will appear here when available.'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-3">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        notification.read 
                          ? 'bg-gray-50/50 border-gray-200' 
                          : 'bg-blue-50/50 border-blue-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium text-sm ${
                                  notification.read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              
                              <p className={`text-sm ${
                                notification.read ? 'text-gray-600' : 'text-gray-800'
                              }`}>
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {format(new Date(notification.created_at), 'MMM dd, yyyy - HH:mm')}
                                </span>
                                
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Mark as read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional data display for specific notification types */}
                          {notification.type === 'low_stock' && notification.data?.items && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                              <h5 className="text-sm font-medium text-orange-800 mb-2">
                                Low Stock Items:
                              </h5>
                              <div className="space-y-1">
                                {notification.data.items.slice(0, 5).map((item: any) => (
                                  <div key={item.id} className="text-xs text-orange-700 flex justify-between">
                                    <span>{item.item_name}</span>
                                    <span>{item.current_stock} / {item.min_stock_level} min</span>
                                  </div>
                                ))}
                                {notification.data.items.length > 5 && (
                                  <div className="text-xs text-orange-600 font-medium">
                                    +{notification.data.items.length - 5} more items
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {notification.type === 'sales_milestone' && notification.data && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                              <div className="text-sm">
                                <div className="flex justify-between text-green-800">
                                  <span>Target:</span>
                                  <span className="font-medium">UGX {notification.data.target?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-green-800">
                                  <span>Achieved:</span>
                                  <span className="font-medium">UGX {notification.data.achieved?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-green-700">
                                  <span>Performance:</span>
                                  <span className="font-bold">{notification.data.percentage?.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {index < filteredNotifications.length - 1 && (
                      <Separator className="my-3" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 text-white rounded-lg">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-blue-700">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 text-white rounded-lg">
                  <BellRing className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unread</p>
                  <p className="text-xl font-bold text-orange-700">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 text-white rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Critical</p>
                  <p className="text-xl font-bold text-red-700">
                    {notifications.filter(n => n.priority === 'critical').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 text-white rounded-lg">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Milestones</p>
                  <p className="text-xl font-bold text-green-700">
                    {notifications.filter(n => n.type === 'sales_milestone').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;