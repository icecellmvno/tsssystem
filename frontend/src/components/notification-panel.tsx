import React from 'react';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotificationStore } from '@/stores/notification-store';
import { useWebSocketStore } from '@/stores/websocket-store';
import { formatDistanceToNow } from 'date-fns';

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'info':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
    case 'error':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
      return '🔵';
    default:
      return '⚪';
  }
};

export function NotificationPanel() {
  const {
    notifications,
    getUnreadNotifications,
    getRecentNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearNotifications,
  } = useNotificationStore();

  const { getAllDevices, StopAlarm } = useWebSocketStore();

  const unreadCount = getUnreadNotifications().length;
  const recentNotifications = getRecentNotifications(10);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const handleRemoveNotification = (id: string) => {
    removeNotification(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  const handleStopAllAlarms = async () => {
    const devices = getAllDevices();
    const alarmNotifications = notifications.filter(n => n.type === 'alarm');
    
    // Get unique device groups that have alarms
    const deviceGroupsWithAlarms = [...new Set(alarmNotifications.map(n => n.device_group))];
    
    let successCount = 0;
    let errorCount = 0;
    
    // Stop alarms for all devices in those groups
    for (const device of devices) {
      if (deviceGroupsWithAlarms.includes(device.device_group)) {
        try {
          await StopAlarm(device.id);
          console.log(`Stop alarm sent to device: ${device.id}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to stop alarm for device ${device.id}:`, error);
          errorCount++;
        }
      }
    }
    
    // Show notification about the result
    if (successCount > 0) {
      useNotificationStore.getState().addNotification({
        type: 'device_status',
        title: 'Alarms Stopped',
        message: `Successfully sent stop alarm command to ${successCount} device(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        severity: errorCount > 0 ? 'warning' : 'info',
      });
    } else if (errorCount > 0) {
      useNotificationStore.getState().addNotification({
        type: 'device_status',
        title: 'Stop Alarm Failed',
        message: `Failed to send stop alarm command to ${errorCount} device(s)`,
        severity: 'error',
      });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex gap-1">
            {notifications.filter(n => n.type === 'alarm').length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStopAllAlarms}
                className="h-8 px-2 text-xs text-orange-600 hover:text-orange-700"
              >
                Stop Alarms
              </Button>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-8 px-2 text-xs"
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 px-2 text-xs text-destructive"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {recentNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-3 rounded-lg border mb-2 transition-colors ${
                    notification.read
                      ? 'bg-background'
                      : 'bg-muted/50 border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getSeverityColor(notification.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-medium text-sm leading-tight">
                          {notification.title}
                        </h5>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveNotification(notification.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          {notification.device_group && (
                            <Badge variant="secondary" className="text-xs">
                              {notification.device_group}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 10 && (
          <div className="p-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Showing 10 of {notifications.length} notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 