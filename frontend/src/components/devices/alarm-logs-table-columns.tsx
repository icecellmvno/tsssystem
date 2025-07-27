import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Battery, 
  Signal, 
  Wifi, 
  Clock,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { AlarmLog } from '@/services/devices';
import { Link } from 'react-router-dom';

// Utility functions
const getAlarmIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'battery_low':
      return <Battery className="h-4 w-4 text-red-600" />;
    case 'signal_low':
      return <Signal className="h-4 w-4 text-red-600" />;
    case 'sim_card_change':
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case 'sim_card_change_resolved':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'device_offline':
      return <Wifi className="h-4 w-4 text-red-600" />;
    case 'error_count':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
};

const getAlarmTypeDisplay = (type: string) => {
  switch (type.toLowerCase()) {
    case 'sim_card_change':
      return 'SIM CARD CHANGE';
    case 'sim_card_change_resolved':
      return 'SIM CARD RESOLVED';
    case 'battery_low':
      return 'BATTERY LOW';
    case 'signal_low':
      return 'SIGNAL LOW';
    case 'device_offline':
      return 'DEVICE OFFLINE';
    case 'error_count':
      return 'ERROR COUNT';
    default:
      return type.replace('_', ' ').toUpperCase();
  }
};

const getSimCardChangeDetails = (message: string) => {
  if (message.includes('SIM tray opened')) {
    return { type: 'TRAY_OPENED', color: 'text-red-600', icon: '📱' };
  } else if (message.includes('SIM tray closed')) {
    return { type: 'TRAY_CLOSED', color: 'text-green-600', icon: '✅' };
  } else if (message.includes('IMSI changed')) {
    return { type: 'IMSI_CHANGED', color: 'text-orange-600', icon: '🔄' };
  } else if (message.includes('SIM card count changed')) {
    return { type: 'COUNT_CHANGED', color: 'text-yellow-600', icon: '📊' };
  } else {
    return { type: 'GENERAL', color: 'text-gray-600', icon: '📱' };
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'error':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'started':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'stopped':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'resolved':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const alarmLogsColumns: ColumnDef<AlarmLog>[] = [
  // Checkbox column for row selection
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'device_id',
    header: 'Device ID',
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.getValue('device_id')}
      </div>
    ),
  },
  {
    accessorKey: 'device_name',
    header: 'Device Name',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue('device_name')}
      </div>
    ),
  },
  {
    accessorKey: 'device_group',
    header: 'Device Group',
    cell: ({ row }) => {
      const deviceGroup = row.getValue('device_group') as string;
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            📱 {deviceGroup}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'country_site',
    header: 'Country Site',
    cell: ({ row }) => {
      const countrySite = row.getValue('country_site') as string;
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            🌍 {countrySite}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'alarm_type',
    header: 'Alarm Type',
    cell: ({ row }) => {
      const type = row.getValue('alarm_type') as string;
      
      return (
        <div className="flex items-center gap-2">
          {getAlarmIcon(type)}
          <span className="text-sm font-medium">
            {getAlarmTypeDisplay(type)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'message',
    header: 'Message',
    cell: ({ row }) => {
      const message = row.getValue('message') as string;
      const alarmType = row.original.alarm_type;

      if (alarmType.toLowerCase() === 'sim_card_change') {
        const details = getSimCardChangeDetails(message);
        return (
          <div className="max-w-[300px] truncate text-sm" title={message}>
            <span className={`font-medium ${details.color}`}>{details.icon} </span>
            {message}
          </div>
        );
      }

      return (
        <div className="max-w-[300px] truncate text-sm" title={message}>
          {message}
        </div>
      );
    },
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    cell: ({ row }) => {
      const severity = row.getValue('severity') as string;
      
      return (
        <Badge variant="outline" className={`text-xs ${getSeverityColor(severity)}`}>
          {severity.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      
      return (
        <Badge variant="outline" className={`text-xs ${getStatusColor(status)}`}>
          {status.toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'battery_level',
    header: 'Battery',
    cell: ({ row }) => {
      const level = row.getValue('battery_level') as number;
      const status = row.original.battery_status;
      
      if (level === 0 && !status) return <span className="text-muted-foreground">-</span>;
      
      return (
        <div className="flex items-center gap-2">
          <Battery className="h-4 w-4" />
          <div className="text-sm">
            {level}% • {status}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'signal_strength',
    header: 'Signal',
    cell: ({ row }) => {
      const strength = row.getValue('signal_strength') as number;
      const dbm = row.original.signal_dbm;
      const networkType = row.original.network_type;
      
      if (strength === 0 && !dbm && !networkType) return <span className="text-muted-foreground">-</span>;
      
      return (
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4" />
          <div className="text-sm">
            {strength}/5 • {dbm} dBm • {networkType}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ row }) => {
      const createdAt = row.getValue('created_at') as string;
      if (!createdAt) return <span className="text-muted-foreground">-</span>;
      
      const date = new Date(createdAt);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      let timeAgo = '';
      if (diffInMinutes < 1) timeAgo = 'Just now';
      else if (diffInMinutes < 60) timeAgo = `${diffInMinutes}m ago`;
      else if (diffInMinutes < 1440) timeAgo = `${Math.floor(diffInMinutes / 60)}h ago`;
      else timeAgo = `${Math.floor(diffInMinutes / 1440)}d ago`;
      
      return (
        <div className="text-sm">
          <div>{timeAgo}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const alarmLog = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link to={`/devices/${alarmLog.device_id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
  },
]; 