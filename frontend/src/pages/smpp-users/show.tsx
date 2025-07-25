import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Zap, Wifi, WifiOff, Clock, CheckCircle, XCircle, Settings, Shield, Filter } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { apiClient } from '@/services/api-client';
import type { SmppUser } from '@/types';

export default function SmppUsersShow() {
  const { id } = useParams<{ id: string }>();
  const [smppUser, setSmppUser] = useState<SmppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  // Fetch SMPP user data
  useEffect(() => {
    const fetchSmppUser = async () => {
      if (!id) return;
      
      try {
        const data = await apiClient.get<{ data: SmppUser }>(`/smpp-users/${id}`);
        setSmppUser(data.data);
      } catch (error) {
        console.error('Error fetching SMPP user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSmppUser();
  }, [id]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SMPP Users',
        href: '/smpp-users',
    },
    {
        title: 'SMPP User Details',
        href: `/smpp-users/${id}`,
    },
  ];

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!smppUser) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">SMPP user not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }



  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (isOnline: boolean) => {
    if (isOnline) {
      return (
        <Badge variant="default" className="bg-green-500 text-white">
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
      </Badge>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge variant="default" className="bg-blue-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getBooleanBadge = (value: boolean) => {
    if (value) {
      return (
        <Badge variant="default" className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enabled
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/smpp-users">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to SMPP Users
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{smppUser.system_id}</h1>
                <p className="text-muted-foreground">SMPP User Details</p>
              </div>
            </div>
            <Link to={`/smpp-users/${smppUser.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit SMPP User
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">System ID</label>
                  <p className="font-mono text-sm">{smppUser.system_id}</p>
                </div>
                
                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Password</label>
                  <p className="font-mono text-sm">{smppUser.password}</p>
                </div>

                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Active Status</label>
                  <div className="mt-1">
                    {getActiveBadge(smppUser.is_active)}
                  </div>
                </div>

                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Connection Status</label>
                  <div className="mt-1">
                    {getStatusBadge(smppUser.is_online)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Connection Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Max Connection Speed</label>
                  <p className="text-lg font-semibold">{smppUser.max_connection_speed} msg/sec</p>
                </div>

                <Separator />

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last IP Address</label>
                  <p className="font-mono text-sm">{smppUser.last_ip_address || 'Never connected'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MT Messaging Credentials - Quota */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                MT Messaging Credentials - Quota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source Address</label>
                  <p className="font-mono text-sm">{smppUser.mt_src_addr || 'None'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP Throughput</label>
                  <p className="font-mono text-sm">{smppUser.mt_http_throughput || 'ND'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Balance</label>
                  <p className="font-mono text-sm">{smppUser.mt_balance || 'ND'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SMPPS Throughput</label>
                  <p className="font-mono text-sm">{smppUser.mt_smpps_throughput || 'ND'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SMS Count</label>
                  <p className="font-mono text-sm">{smppUser.mt_sms_count || 'ND'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Early Percent</label>
                  <p className="font-mono text-sm">{smppUser.mt_early_percent || 'ND'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MT Messaging Credentials - Value Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                MT Messaging Credentials - Value Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority Filter</label>
                  <p className="font-mono text-sm">{smppUser.mt_priority_filter || '^[0-3]$'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Content Filter</label>
                  <p className="font-mono text-sm">{smppUser.mt_content_filter || '.*'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source Address Filter</label>
                  <p className="font-mono text-sm">{smppUser.mt_src_addr_filter || '.*'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Destination Address Filter</label>
                  <p className="font-mono text-sm">{smppUser.mt_dst_addr_filter || '.*'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Validity Period Filter</label>
                  <p className="font-mono text-sm">{smppUser.mt_validity_period_filter || '^\\d+$'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MT Messaging Credentials - Authorization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                MT Messaging Credentials - Authorization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP Send</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_http_send)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP DLR Method</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_http_dlr_method)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP Balance</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_http_balance)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SMPPS Send</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_smpps_send)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_priority)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP Long Content</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_http_long_content)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source Address Auth</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_src_addr_auth)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">DLR Level</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_dlr_level)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP Rate</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_http_rate)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Validity Period</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_validity_period)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">HTTP Bulk</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_http_bulk)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hex Content</label>
                  <div className="mt-1">
                    {getBooleanBadge(smppUser.mt_hex_content)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Connection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Connected</label>
                  <p>{formatDateTime(smppUser.last_connected_at || null)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Disconnected</label>
                  <p>{formatDateTime(smppUser.last_disconnected_at || null)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p>{formatDateTime(smppUser.created_at)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p>{formatDateTime(smppUser.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 