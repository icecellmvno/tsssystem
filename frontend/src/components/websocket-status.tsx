import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Bell, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useWebSocket } from '@/contexts/websocket-context';
import { useNotificationStore } from '@/stores/notification-store';

export const WebSocketStatus: React.FC = () => {
  const { isConnected } = useWebSocket();
  const { getUnreadNotifications, clearNotifications } = useNotificationStore();
  
  const unreadNotifications = getUnreadNotifications();
  const recentNotifications = unreadNotifications.filter(notification => 
    notification.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
  );

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Connection Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? "Live" : "Offline"}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>WebSocket {isConnected ? 'Connected' : 'Disconnected'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications Indicator */}
        {recentNotifications.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative p-1 h-8 w-8"
                onClick={clearNotifications}
              >
                <Bell className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {recentNotifications.length > 9 ? '9+' : recentNotifications.length}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium mb-2">Recent Notifications ({recentNotifications.length})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recentNotifications.slice(0, 3).map((notification, index) => (
                    <div key={index} className="text-xs">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">{notification.title}</span>
                      </div>
                      <p className="text-muted-foreground">{notification.message}</p>
                    </div>
                  ))}
                  {recentNotifications.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{recentNotifications.length - 3} more notifications
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={clearNotifications}
                >
                  Clear All
                </Button>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}; 