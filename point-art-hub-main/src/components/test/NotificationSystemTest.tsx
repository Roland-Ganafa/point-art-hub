import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  initializeNotificationSystem,
  sendTestNotification,
  generateLowStockNotifications,
  generateSalesMilestoneNotifications,
  generateBackupReminderNotification,
  getNotifications,
  getUnreadNotificationCount,
  getNotificationSettings,
  type NotificationEvent
} from '@/utils/notificationUtils';
import { 
  Bell, 
  TestTube, 
  CheckCircle, 
  AlertTriangle, 
  Package, 
  Target,
  Archive,
  Settings,
  RefreshCw
} from 'lucide-react';

const NotificationSystemTest = () => {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const refreshNotifications = () => {
    const allNotifications = getNotifications();
    setNotifications(allNotifications.slice(0, 10)); // Show latest 10
    setUnreadCount(getUnreadNotificationCount());
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleInitializeSystem = async () => {
    try {
      await initializeNotificationSystem();
      setIsInitialized(true);
      addTestResult('✅ Notification system initialized successfully');
      refreshNotifications();
    } catch (error) {
      addTestResult(`❌ Failed to initialize notification system: ${error}`);
    }
  };

  const handleSendTestNotification = () => {
    try {
      sendTestNotification();
      addTestResult('✅ Test notification sent successfully');
      refreshNotifications();
    } catch (error) {
      addTestResult(`❌ Failed to send test notification: ${error}`);
    }
  };

  const handleTestLowStockCheck = async () => {
    try {
      await generateLowStockNotifications();
      addTestResult('✅ Low stock check completed');
      refreshNotifications();
    } catch (error) {
      addTestResult(`❌ Low stock check failed: ${error}`);
    }
  };

  const handleTestSalesMilestones = async () => {
    try {
      await generateSalesMilestoneNotifications();
      addTestResult('✅ Sales milestone check completed');
      refreshNotifications();
    } catch (error) {
      addTestResult(`❌ Sales milestone check failed: ${error}`);
    }
  };

  const handleTestBackupReminder = () => {
    try {
      generateBackupReminderNotification();
      addTestResult('✅ Backup reminder check completed');
      refreshNotifications();
    } catch (error) {
      addTestResult(`❌ Backup reminder check failed: ${error}`);
    }
  };

  const handleTestNotificationSettings = () => {
    try {
      const settings = getNotificationSettings();
      addTestResult(`✅ Notification settings loaded: ${JSON.stringify(settings, null, 2)}`);
    } catch (error) {
      addTestResult(`❌ Failed to load notification settings: ${error}`);
    }
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
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'medium':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'low':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Notification System Test Suite
          </CardTitle>
          <CardDescription>
            Test and validate all notification system functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Status */}
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              Notification System: {isInitialized ? 'Initialized' : 'Not Initialized'}
            </span>
            <Badge variant={unreadCount > 0 ? 'destructive' : 'secondary'}>
              {unreadCount} unread notifications
            </Badge>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button onClick={handleInitializeSystem} variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Initialize System
            </Button>
            
            <Button onClick={handleSendTestNotification} variant="outline" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Send Test Notification
            </Button>
            
            <Button onClick={handleTestLowStockCheck} variant="outline" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Test Low Stock Check
            </Button>
            
            <Button onClick={handleTestSalesMilestones} variant="outline" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Test Sales Milestones
            </Button>
            
            <Button onClick={handleTestBackupReminder} variant="outline" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Test Backup Reminder
            </Button>
            
            <Button onClick={handleTestNotificationSettings} variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Test Settings
            </Button>
          </div>

          <Button onClick={refreshNotifications} variant="ghost" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">No test results yet. Run some tests to see results here.</p>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="p-2 bg-muted rounded text-sm font-mono"
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Current Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Alert>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  No notifications found. Try running some tests to generate notifications.
                </AlertDescription>
              </Alert>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-3 rounded-lg border ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSystemTest;