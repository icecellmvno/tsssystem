import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Smartphone, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api-client';

interface SmsLimitStatus {
  device_name: string;
  sim_slot: number;
  daily_limit: number;
  daily_used: number;
  daily_percentage: number;
  monthly_limit: number;
  monthly_used: number;
  monthly_percentage: number;
  alarm_threshold: number;
  daily_alarm: boolean;
  monthly_alarm: boolean;
}

interface SmsLimitStatusProps {
  deviceImei: string;
  simSlot: number;
}

export function SmsLimitStatus({ deviceImei, simSlot }: SmsLimitStatusProps) {
  const [status, setStatus] = useState<SmsLimitStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/devices/${deviceImei}/sms-limits/status?sim_slot=${simSlot}`);
      setStatus((response as any).data.data);
    } catch (error) {
      console.error('Failed to fetch SMS limit status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [deviceImei, simSlot]);

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            SMS Limit Status - SIM {simSlot}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            {loading ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <span className="text-muted-foreground">No data available</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getProgressColor = (percentage: number, hasAlarm: boolean) => {
    if (hasAlarm) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAlarmBadge = (hasAlarm: boolean) => {
    if (hasAlarm) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Limit Warning
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            SMS Limit Status - SIM {simSlot}
          </div>
          <div className="flex items-center gap-2">
            {getAlarmBadge(status.daily_alarm || status.monthly_alarm)}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Daily Limit</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {status.daily_used} / {status.daily_limit}
            </span>
          </div>
          <Progress
            value={status.daily_percentage}
            className="h-2"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {status.daily_percentage.toFixed(1)}% used
            </span>
            {status.daily_alarm && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {status.alarm_threshold}% threshold reached
              </Badge>
            )}
          </div>
        </div>

        {/* Monthly Limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="font-medium">Monthly Limit</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {status.monthly_used} / {status.monthly_limit}
            </span>
          </div>
          <Progress
            value={status.monthly_percentage}
            className="h-2"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {status.monthly_percentage.toFixed(1)}% used
            </span>
            {status.monthly_alarm && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {status.alarm_threshold}% threshold reached
              </Badge>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground">
            <p>Device: {status.device_name}</p>
            <p>Alarm threshold: {status.alarm_threshold}%</p>
            {status.daily_alarm || status.monthly_alarm ? (
              <p className="text-red-600 font-medium mt-1">
                ⚠️ Limit warning active - check alarm logs
              </p>
            ) : (
              <p className="text-green-600 font-medium mt-1">
                ✅ All limits within normal range
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 