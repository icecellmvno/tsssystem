import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Phone, MessageSquare, Hash, Calendar, DollarSign, Settings, CheckCircle, XCircle, Smartphone, CreditCard, AlertTriangle, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/contexts/websocket-context';
import { toast } from 'sonner';

interface SmsLogItem {
    id: number;
    message_id: string;
    msg_id: string;
    operator_msg_id: string;
    uid: string;
    correlation_id: string;
    device_id: string;
    device_name: string;
    device_imei: string;
    device_imsi: string;
    simcard_name: string;
    sim_slot: number;
    simcard_number: string;
    simcard_iccid: string;
    device_group_id: number;
    device_group: string;
    sitename_id: number;
    sitename: string;
    source_addr: string;
    source_username: string;
    destination_addr: string;
    message: string;
    message_length: number;
    message_encoding: string;
    direction: string;
    priority: string;
    status: string;
    status_code: string;
    retry_count: number;
    max_retries: number;
    queued_at: string;
    sent_at: string;
    delivered_at: string;
    expires_at: string;
    processed_at: string;
    smpp_user_id: number;
    smpp_sent: boolean;
    operator_name: string;
    operator_code: string;
    mcc: string;
    mnc: string;
    rate: string;
    charge: string;
    currency: string;
    pdu_count: number;
    total_cost: string;
    error_message: string;
    error_code: string;
    delivery_report_requested: boolean;
    delivery_report_received_at: string;
    delivery_report_status: string;
    processing_time_ms: number;
    queue_time_ms: number;
    is_blacklisted: boolean;
    campaign_id: string;
    batch_id: string;
    metadata: any;
    created_at: string;
    updated_at: string;
    
    // Legacy fields for backward compatibility
    source_connector: string;
    routed_cid: string;
    short_message: string;
    trials: number;
    device_sims: string;
}

interface Props {
    smsLog: SmsLogItem;
}

export default function SmsLogShow() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuthStore();
  const ws = useWebSocket();
  const [smsLog, setSmsLog] = useState<SmsLogItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Create dynamic breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'SMS Logs',
      href: '/sms-logs',
    },
    {
      title: smsLog ? `SMS Log #${smsLog.id}` : 'Loading...',
      href: smsLog ? `/sms-logs/${smsLog.id}` : '#',
    },
  ];

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !token) {
      window.location.href = '/login';
      return;
    }
  }, [isAuthenticated, token]);

  // Fetch SMS log data
  const fetchSmsLog = async () => {
    if (!id || !isAuthenticated || !token) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/sms-logs/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSmsLog(data);
      } else {
        toast.error('Failed to fetch SMS log');
        window.location.href = '/sms-logs';
      }
    } catch (error) {
      console.error('Error fetching SMS log:', error);
      toast.error('Failed to fetch SMS log');
      window.location.href = '/sms-logs';
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSmsLog();
  }, [id, token, isAuthenticated]);

  // Update SMS log with WebSocket real-time data
  useEffect(() => {
    // This will be implemented when WebSocket SMS log updates are available
  }, [ws.devices]);

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'default';
            case 'failed':
                return 'destructive';
            case 'pending':
                return 'secondary';
            case 'sent':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
        }
    };

    if (loading || !smsLog) {
        return <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col items-center justify-center">
                <p>Loading SMS Log...</p>
            </div>
        </AppLayout>;
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/sms-logs">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to List
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">SMS Log Details</h1>
                            <p className="text-muted-foreground">
                                Message ID: {smsLog.msg_id}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon(smsLog.status)}
                        <Badge variant={getStatusBadgeVariant(smsLog.status)}>
                            {smsLog.status}
                        </Badge>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="device">Device & SIM</TabsTrigger>
                        <TabsTrigger value="technical">Technical</TabsTrigger>
                        <TabsTrigger value="financial">Financial</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Message Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Message Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Message ID</label>
                                            <p className="text-sm font-mono">{smsLog.msg_id}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Operator Message ID</label>
                                            <p className="text-sm font-mono">{smsLog.operator_msg_id}</p>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Message Content</label>
                                        <div className="mt-1 p-3 bg-muted rounded-md">
                                            <p className="text-sm whitespace-pre-wrap">{smsLog.message || smsLog.short_message}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Message Length</label>
                                            <p className="text-sm">{smsLog.message_length || 0} characters</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Message Encoding</label>
                                            <p className="text-sm">{smsLog.message_encoding || 'GSM7'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">PDU Count</label>
                                            <p className="text-sm">{smsLog.pdu_count || 1}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Retry Count</label>
                                            <p className="text-sm">{smsLog.retry_count || 0} / {smsLog.max_retries || 3}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Address Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="h-5 w-5" />
                                        Address Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Source Address</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-mono">{smsLog.source_addr}</span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Destination Address</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-mono">{smsLog.destination_addr}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Operator Name</label>
                                            <p className="text-sm">{smsLog.operator_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Operator Code</label>
                                            <p className="text-sm">{smsLog.operator_code || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">MCC/MNC</label>
                                            <p className="text-sm">{smsLog.mcc || 'N/A'}/{smsLog.mnc || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">UID</label>
                                            <p className="text-sm font-mono">{smsLog.uid || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Status Alert */}
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="flex items-center justify-between">
                                    <span>Message Status: <Badge variant={getStatusBadgeVariant(smsLog.status)}>{smsLog.status}</Badge></span>
                                    <span>SMPP Sent: <Badge variant={smsLog.smpp_sent ? 'default' : 'secondary'}>{smsLog.smpp_sent ? 'Yes' : 'No'}</Badge></span>
                                </div>
                            </AlertDescription>
                        </Alert>

                        {/* Error Alert */}
                        {(smsLog.error_message || smsLog.error_code) && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        {smsLog.error_message && (
                                            <p className="font-medium">Error: {smsLog.error_message}</p>
                                        )}
                                        {smsLog.error_code && (
                                            <p className="text-sm font-mono">Code: {smsLog.error_code}</p>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </TabsContent>

                    {/* Device & SIM Tab */}
                    <TabsContent value="device" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Device Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Smartphone className="h-5 w-5" />
                                        Device Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                                            <p className="text-sm font-mono font-semibold">{smsLog.device_id || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Device Name</label>
                                            <p className="text-sm font-semibold">{smsLog.device_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    {smsLog.device_imei && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Device IMEI</label>
                                            <p className="text-sm font-mono font-semibold">{smsLog.device_imei}</p>
                                        </div>
                                    )}
                                    {smsLog.device_imsi && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Device IMSI</label>
                                            <p className="text-sm font-mono font-semibold">{smsLog.device_imsi}</p>
                                        </div>
                                    )}
                                    {smsLog.device_group && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Device Group</label>
                                            <p className="text-sm font-semibold">{smsLog.device_group}</p>
                                        </div>
                                    )}
                                    {smsLog.sitename && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Sitename</label>
                                            <p className="text-sm font-semibold">{smsLog.sitename}</p>
                                        </div>
                                    )}
                                    {smsLog.device_group_id && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Device Group ID</label>
                                            <p className="text-sm font-semibold">{smsLog.device_group_id}</p>
                                        </div>
                                    )}
                                    
                                    {/* Metadata'dan Ek Device Bilgileri */}
                                    {smsLog.metadata && (
                                        <>
                                            <Separator />
                                            <div className="space-y-2">
                                                {smsLog.metadata.device_imei && (
                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground">Device IMEI</label>
                                                        <p className="text-sm font-mono">{smsLog.metadata.device_imei}</p>
                                                    </div>
                                                )}
                                                {smsLog.metadata.device_imsi && (
                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground">Device IMSI</label>
                                                        <p className="text-sm font-mono">{smsLog.metadata.device_imsi}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* SIM Card Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        SIM Card Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">SIM Card Name</label>
                                            <p className="text-sm font-semibold">{smsLog.simcard_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">SIM Slot</label>
                                            <p className="text-sm font-semibold">{smsLog.sim_slot || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">SIM Number</label>
                                            <p className="text-sm font-mono font-semibold">{smsLog.simcard_number || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">SIM ICCID</label>
                                            <p className="text-sm font-mono font-semibold">{smsLog.simcard_iccid || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Connection Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Connection Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Source Connector</label>
                                        <p className="text-sm font-semibold">{smsLog.source_connector || smsLog.metadata?.source_connector || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Source Username</label>
                                        <p className="text-sm font-semibold">{smsLog.source_username || smsLog.metadata?.source_username || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Routed CID</label>
                                        <p className="text-sm font-semibold">{smsLog.routed_cid || smsLog.metadata?.routed_cid || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Technical Tab */}
                    <TabsContent value="technical" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Message Properties */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Message Properties
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Direction</label>
                                            <Badge variant={smsLog.direction === 'inbound' ? 'default' : 'outline'}>
                                                {smsLog.direction}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Priority</label>
                                            <Badge variant={smsLog.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                                {smsLog.priority}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status Code</label>
                                            <p className="text-sm font-mono">{smsLog.status_code || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Delivery Report</label>
                                            <Badge variant={smsLog.delivery_report_requested ? 'default' : 'secondary'}>
                                                {smsLog.delivery_report_requested ? 'Requested' : 'Not Requested'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Processing Time</label>
                                            <p className="text-sm">{smsLog.processing_time_ms || 'N/A'} ms</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Queue Time</label>
                                            <p className="text-sm">{smsLog.queue_time_ms || 'N/A'} ms</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        Additional Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Correlation ID</label>
                                            <p className="text-sm font-mono">{smsLog.correlation_id || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Campaign ID</label>
                                            <p className="text-sm">{smsLog.campaign_id || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Batch ID</label>
                                            <p className="text-sm">{smsLog.batch_id || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Blacklisted</label>
                                            <Badge variant={smsLog.is_blacklisted ? 'destructive' : 'secondary'}>
                                                {smsLog.is_blacklisted ? 'Yes' : 'No'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {smsLog.delivery_report_status && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Delivery Report Status</label>
                                            <p className="text-sm">{smsLog.delivery_report_status}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Financial Tab */}
                    <TabsContent value="financial" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Financial Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <label className="text-sm font-medium text-muted-foreground">Rate</label>
                                        <p className="text-2xl font-bold text-green-600">${smsLog.rate || '0.0000'}</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <label className="text-sm font-medium text-muted-foreground">Charge</label>
                                        <p className="text-2xl font-bold text-blue-600">${smsLog.charge || '0.0000'}</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                                        <p className="text-2xl font-bold text-purple-600">${smsLog.total_cost || '0.0000'}</p>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <label className="text-sm font-medium text-muted-foreground">Currency</label>
                                        <p className="text-lg font-semibold">{smsLog.currency || 'USD'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Message Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Created</p>
                                            <p className="text-sm text-muted-foreground">{new Date(smsLog.created_at || '').toLocaleString()}</p>
                                        </div>
                                    </div>
                                    
                                    {smsLog.queued_at && (
                                        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Queued</p>
                                                <p className="text-sm text-muted-foreground">{new Date(smsLog.queued_at || '').toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {smsLog.sent_at && (
                                        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Sent</p>
                                                <p className="text-sm text-muted-foreground">{new Date(smsLog.sent_at || '').toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {smsLog.delivered_at && (
                                        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Delivered</p>
                                                <p className="text-sm text-muted-foreground">{new Date(smsLog.delivered_at || '').toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {smsLog.processed_at && (
                                        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Processed</p>
                                                <p className="text-sm text-muted-foreground">{new Date(smsLog.processed_at || '').toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Updated</p>
                                            <p className="text-sm text-muted-foreground">
                                                {smsLog.updated_at ? new Date(smsLog.updated_at || '').toLocaleString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
} 