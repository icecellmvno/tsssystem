import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/contexts/websocket-context';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const { isConnected, isConnecting, error } = useWebSocket();

  const getStatusInfo = () => {
    if (isConnecting) {
      return {
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        text: 'Connecting...',
        variant: 'secondary' as const,
        color: 'text-yellow-600'
      };
    }
    
    if (isConnected) {
      return {
        icon: <Wifi className="h-3 w-3" />,
        text: 'Connected',
        variant: 'default' as const,
        color: 'text-green-600'
      };
    }
    
    return {
      icon: <WifiOff className="h-3 w-3" />,
      text: 'Disconnected',
      variant: 'destructive' as const,
      color: 'text-red-600'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={statusInfo.variant} 
        className={cn('flex items-center gap-1', statusInfo.color)}
      >
        {statusInfo.icon}
        {statusInfo.text}
      </Badge>
      {error && (
        <span className="text-xs text-red-600 max-w-32 truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}; 