import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { ArrowLeft, AlertTriangle, Smartphone, Calendar, Clock, Settings, CheckCircle, XCircle } from 'lucide-react';

interface AlarmLog {
  id: number;
  device_id: string;
  device_name: string;
  device_group: string;
  sitename: string;
  alarm_type: string;
  message: string;
  severity: string;
  status: string;
  battery_level: number;
  battery_status: string;
  signal_strength: number;
  signal_dbm: number;
  network_type: string;
  created_at: string;
  updated_at: string;
}

export default function AlarmLogShow() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const [alarmLog, setAlarmLog] = useState<AlarmLog | null>(null);
  const [loading, setLoading] = useState(true);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '#' },
    { title: 'Alarm Logs', href: '/alarm-logs' },
    { title: 'Details', href: '#' },
  ];

  // Fetch alarm log from API
  const fetchAlarmLog = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/alarm-logs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlarmLog(data);
      } else {
        toast.error('Failed to fetch alarm log');
      }
    } catch (error) {
      console.error('Error fetching alarm log:', error);
      toast.error('Failed to fetch alarm log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarmLog();
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'stopped':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'started':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'started': return 'default';
      case 'stopped': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading alarm log...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!alarmLog) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Alarm Log Not Found</h2>
              <p className="text-muted-foreground mb-4">The alarm log you're looking for doesn't exist.</p>
              <Link to="/alarm-logs">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Alarm Logs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/alarm-logs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Alarm Log Details</h1>
              <p className="text-muted-foreground">
                Device: {alarmLog.device_name || alarmLog.device_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(alarmLog.status)}
            <Badge variant={getStatusColor(alarmLog.status) as any}>
              {alarmLog.status?.toUpperCase() || 'N/A'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alarm Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alarm Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Alarm Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {alarmLog.alarm_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                  <div className="mt-1">
                    <Badge variant={getSeverityColor(alarmLog.severity) as any}>
                      {alarmLog.severity?.toUpperCase() || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="text-sm whitespace-pre-wrap">{alarmLog.message || 'No message available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                <div className="flex items-center gap-2 mt-1">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{alarmLog.device_id}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                <p className="text-sm">{alarmLog.device_name || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                <p className="text-sm">{alarmLog.device_group || 'N/A'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Sitename</label>
                <p className="text-sm">{alarmLog.sitename || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Device Status at Alarm Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Device Status at Alarm Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Battery Level</label>
                  <p className="text-sm">{alarmLog.battery_level || 0}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Battery Status</label>
                  <p className="text-sm">{alarmLog.battery_status || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signal Strength</label>
                  <p className="text-sm">{alarmLog.signal_strength || 0}/5</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signal DBM</label>
                  <p className="text-sm">{alarmLog.signal_dbm || 0} dBm</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Network Type</label>
                <p className="text-sm">{alarmLog.network_type || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{new Date(alarmLog.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm">{new Date(alarmLog.updated_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Record ID</label>
                <p className="text-sm font-mono">{alarmLog.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 