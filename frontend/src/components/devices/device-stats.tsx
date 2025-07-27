import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Wifi, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wrench,
  Signal
} from 'lucide-react';
import { DeviceStats as DeviceStatsType } from '@/services/devices';

interface DeviceStatsProps {
  stats: DeviceStatsType;
  loading?: boolean;
}

export function DeviceStats({ stats, loading = false }: DeviceStatsProps) {
  const cards = [
    {
      title: 'Total Devices',
      value: stats.total || 0,
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Active Devices',
      value: stats.active || 0,
      percentage: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Inactive Devices',
      value: stats.inactive || 0,
      percentage: stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Online Devices',
      value: stats.online || 0,
      percentage: stats.total > 0 ? Math.round((stats.online / stats.total) * 100) : 0,
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Ready Devices',
      value: stats.ready || 0,
      percentage: stats.total > 0 ? Math.round((stats.ready / stats.total) * 100) : 0,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Alarm Devices',
      value: stats.alarm || 0,
      percentage: stats.total > 0 ? Math.round((stats.alarm / stats.total) * 100) : 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title} className={`border ${card.borderColor} ${loading ? 'opacity-50' : ''} hover:shadow-md transition-all duration-200`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <span className={card.color}>{card.value}</span>
              )}
            </div>
            {card.percentage !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {loading ? (
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                  `${card.percentage}% of total`
                )}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 