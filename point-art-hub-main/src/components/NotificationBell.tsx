import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationEvent
} from '@/utils/notificationUtils';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Package,
  Target,
  Settings,
  Archive,
  Eye,
  AlertTriangle
} from 'lucide-react';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications.slice(0, 5)); // Show only latest 5 in dropdown
    setUnreadCount(getUnreadNotificationCount());
  };

  useEffect(() => {
    loadNotifications();
    
    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markNotificationAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = (event: React.MouseEvent) => {
    event.stopPropagation();
    markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Package className="h-3 w-3 text-orange-500" />;
      case 'sales_milestone':
        return <Target className="h-3 w-3 text-green-500" />;
      case 'system_event':
        return <Settings className="h-3 w-3 text-blue-500" />;
      case 'backup_reminder':
        return <Archive className="h-3 w-3 text-purple-500" />;
      default:
        return <Bell className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
        return 'border-l-gray-400';
      default:
        return 'border-l-gray-400';
    }
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative hover:bg-white/20 text-white"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80 p-0" 
        align="end" 
        sideOffset={5}
      >
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-100"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border-l-2 ${
                      getPriorityColor(notification.priority)
                    } ${
                      notification.read ? 'opacity-70' : 'bg-blue-50/30'
                    }`}
                    onClick={() => handleViewAll()}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                            
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMarkAsRead(notification.id, e)}
                                className="h-5 w-5 p-0 hover:bg-blue-100 text-blue-600"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-xs mt-1 ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {truncateMessage(notification.message)}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                          </span>
                          
                          {notification.priority === 'critical' && (
                            <Badge variant="destructive" className="text-xs py-0 px-1">
                              Critical
                            </Badge>
                          )}
                          {notification.priority === 'high' && (
                            <Badge variant="secondary" className="text-xs py-0 px-1 bg-orange-100 text-orange-800">
                              High
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="w-full justify-center text-blue-600 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;