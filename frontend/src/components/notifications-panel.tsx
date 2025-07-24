import React, { useState } from 'react';
import { Bell, X, Check, Trash2, AlertTriangle, AlertCircle, Info, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/stores/notification-store';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface NotificationsPanelProps {
  className?: string;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    getUnreadNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    removeNotification, 
    clearNotifications 
  } = useNotificationStore();
  
  const unreadNotifications = getUnreadNotifications();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getAlarmCount = () => {
    return notifications.filter(n => n.type === 'alarm').length;
  };

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-12 z-50 w-96 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex gap-1">
                {unreadNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllNotificationsAsRead}
                    className="h-8 px-2"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearNotifications}
                    className="h-8 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
              </span>
              {getAlarmCount() > 0 && (
                <Link 
                  to="/alarm-logs" 
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{getAlarmCount()} alarms</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        getSeverityColor(notification.severity),
                        !notification.read && 'ring-2 ring-blue-200 dark:ring-blue-800'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getSeverityIcon(notification.severity)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-foreground truncate">
                                {notification.title}
                              </h4>
                              {notification.type === 'alarm' && (
                                <Badge variant="destructive" className="text-xs">
                                  ALARM
                                </Badge>
                              )}
                              {notification.device_group && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.device_group}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {notification.sitename && (
                                <span className="text-xs text-muted-foreground">
                                  {notification.sitename}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markNotificationAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotification(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 