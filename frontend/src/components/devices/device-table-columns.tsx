import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Battery, 
  Signal, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wrench,
  Eye,
  Edit,
  Trash2,
  Settings,
  Power
} from 'lucide-react';
import { Device } from '@/services/devices';
import { Link } from 'react-router-dom';

// Add callback prop for rename functionality and maintenance mode
interface DeviceTableColumnsProps {
  onRenameDevice?: (device: Device) => void;
  onEnterMaintenance?: (device: Device) => void;
  onExitMaintenance?: (device: Device) => void;
}

// Utility functions
const getSignalColor = (strength: number) => {
  if (strength >= 4) return 'text-green-600';
  if (strength >= 2) return 'text-yellow-600';
  return 'text-red-600';
};

const getSignalIcon = (strength: number) => {
  if (strength >= 4) return <Signal className="h-4 w-4 text-green-600" />;
  if (strength >= 2) return <Signal className="h-4 w-4 text-yellow-600" />;
  return <Signal className="h-4 w-4 text-red-600" />;
};

const getBatteryColor = (level: number) => {
  if (level >= 50) return 'text-green-600';
  if (level >= 20) return 'text-yellow-600';
  return 'text-red-600';
};

const getBatteryIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'charging':
      return <Battery className="h-4 w-4 text-green-600" />;
    case 'discharging':
      return <Battery className="h-4 w-4 text-yellow-600" />;
    case 'full':
      return <Battery className="h-4 w-4 text-green-600" />;
    default:
      return <Battery className="h-4 w-4 text-gray-600" />;
  }
};

const getBatteryStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case 'charging':
      return 'Charging';
    case 'discharging':
      return 'Discharging';
    case 'full':
      return 'Full';
    default:
      return status;
  }
};

const getStatusDisplay = (device: Device) => {
  const { alarms = [], maintenance_mode, is_active, is_online } = device;
  
  // Check for active alarms
  const hasActiveAlarm = alarms.some(alarm => 
    alarm.status === 'started' && 
    ['critical', 'error', 'warning'].includes(alarm.severity)
  );

  if (hasActiveAlarm) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="destructive" className="text-xs">
          🔴 ALARM
        </Badge>
        <div className="text-xs text-muted-foreground max-w-[150px] truncate">
          {alarms.length} active alarm(s)
        </div>
      </div>
    );
  } else if (maintenance_mode) {
    return (
      <div className="flex flex-col gap-1">
        <Badge variant="secondary" className="text-xs bg-yellow-500 text-white hover:bg-yellow-600">
          🟡 MAINTENANCE
        </Badge>
        {device.maintenance_reason && (
          <div className="text-xs text-muted-foreground max-w-[150px] truncate" title={device.maintenance_reason}>
            {device.maintenance_reason}
          </div>
        )}
      </div>
    );
  } else if (!is_active) {
    return (
      <Badge variant="destructive" className="text-xs">
        🔴 INACTIVE
      </Badge>
    );
  } else if (!is_online) {
    return (
      <Badge variant="destructive" className="text-xs">
        🔴 OFFLINE
      </Badge>
    );
  } else {
    return (
      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
        🟢 READY
      </Badge>
    );
  }
};

export const createDeviceColumns = (
  onRenameDevice?: (device: Device) => void,
  onEnterMaintenance?: (device: Device) => void,
  onExitMaintenance?: (device: Device) => void
): ColumnDef<Device>[] => [
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
    accessorKey: 'imei',
    header: 'IMEI',
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.getValue('imei')}
      </div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Device Name',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue('name')}
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
    accessorKey: 'battery_level',
    header: 'Battery',
    cell: ({ row }) => {
      const level = row.getValue('battery_level') as number;
      const status = row.original.battery_status;
      
      return (
        <div className="flex items-center gap-2">
          {getBatteryIcon(status)}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs">
              <span>{level}%</span>
              <span className="text-muted-foreground">{getBatteryStatusText(status)}</span>
            </div>
            <Progress value={level} className="h-1" />
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
      
      return (
        <div className="flex items-center gap-2">
          {getSignalIcon(strength)}
          <div className="flex flex-col">
            <div className="text-sm font-medium">{strength}/5</div>
            <div className="text-xs text-muted-foreground">
              {dbm} dBm • {networkType}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'is_online',
    header: 'Online',
    cell: ({ row }) => {
      const isOnline = row.getValue('is_online') as boolean;
      
      return (
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <span className="text-sm">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => getStatusDisplay(row.original),
  },
  {
    accessorKey: 'last_seen',
    header: 'Last Seen',
    cell: ({ row }) => {
      const lastSeen = row.getValue('last_seen') as string;
      if (!lastSeen) return <span className="text-muted-foreground">Never</span>;
      
      const date = new Date(lastSeen);
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
            {date.toLocaleDateString()}
          </div>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const device = row.original;
      
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link to={`/devices/${device.imei}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onRenameDevice) {
                onRenameDevice(device);
              }
            }}
            title="Rename Device"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {/* Maintenance Mode Buttons */}
          {device.maintenance_mode ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onExitMaintenance) {
                  onExitMaintenance(device);
                }
              }}
              title="Exit Maintenance Mode"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Wrench className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onEnterMaintenance) {
                  onEnterMaintenance(device);
                }
              }}
              title="Enter Maintenance Mode"
              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
            >
              <Wrench className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];

// Export default columns for backward compatibility
export const deviceColumns = createDeviceColumns(); 