import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { useWebSocket } from '@/contexts/websocket-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Search, Plus, RefreshCw, User, Shield, Activity, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { smppUsersService, type SmppUser } from '@/services/smpp-users';
import { ColumnDef } from '@tanstack/react-table';

interface SmppUserWithBase extends SmppUser, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'SMPP Users', href: '/smpp-users' },
];

export default function SmppUsersIndex() {
  const { token } = useAuthStore();
  const { isConnected, smppUsers: realtimeSmppUsers } = useWebSocket();
  const [smppUsers, setSmppUsers] = useState<SmppUserWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');


  // Fetch SMPP users from API
  const fetchSmppUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await smppUsersService.getSmppUsers();
      
      // Check if data exists and has data property
      const smppUsersData = data?.data || [];
      
      // Transform data to include BaseRecord properties
      const transformedData: SmppUserWithBase[] = Array.isArray(smppUsersData) 
        ? smppUsersData.map(smppUser => ({
            ...smppUser,
            id: smppUser.id,
            created_at: smppUser.created_at,
            updated_at: smppUser.updated_at,
          }))
        : [];
      
      setSmppUsers(transformedData);
    } catch (error) {
      console.error('Error fetching SMPP users:', error);
      toast.error('Failed to fetch SMPP users');
      setSmppUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSmppUsers();
  }, [fetchSmppUsers]);

  // Listen for SMPP user status updates from WebSocket
  useEffect(() => {
    const handleSmppUserStatusUpdate = (event: CustomEvent) => {
      const data = event.detail;
      console.log('SMPP User Status Update received:', data);
      
      // Update the specific SMPP user's status
      setSmppUsers(prevUsers => {
        return prevUsers.map(user => {
          if (user.system_id === data.system_id) {
            return {
              ...user,
              is_online: data.is_online || false,
              last_connected_at: data.last_connected_at,
              last_ip_address: data.last_ip_address,
              connection_count: data.connection_count || user.connection_count,
              total_messages_sent: data.total_messages_sent || user.total_messages_sent,
              total_messages_received: data.total_messages_received || user.total_messages_received
            };
          }
          return user;
        });
      });
    };

    // Add event listener
    window.addEventListener('smpp-user-status-update', handleSmppUserStatusUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('smpp-user-status-update', handleSmppUserStatusUpdate as EventListener);
    };
  }, []);

  // Combine API data with real-time data
  const combinedSmppUsers = useMemo(() => {
    const apiUsers = smppUsers || [];
    const realtimeUsers = realtimeSmppUsers || [];
    
    const merged = [...apiUsers];
    
    realtimeUsers.forEach(realtimeUser => {
      const existingIndex = merged.findIndex(user => user.system_id === realtimeUser.system_id);
      
      if (existingIndex === -1) {
        // Add new real-time user
        merged.push({
          id: 0, // Temporary ID for real-time data
          system_id: realtimeUser.system_id,
          password: '',
          max_connection_speed: 100,
          is_active: true,
          is_online: realtimeUser.is_online || false,
          connection_count: 0,
          total_messages_sent: 0,
          total_messages_received: 0,
          last_connected_at: realtimeUser.last_connected_at,
          last_ip_address: realtimeUser.last_ip_address,
          mt_http_send: true,
          mt_http_dlr_method: true,
          mt_http_balance: true,
          mt_smpps_send: true,
          mt_priority: true,
          mt_http_long_content: true,
          mt_src_addr_auth: true,
          mt_dlr_level: true,
          mt_http_rate: true,
          mt_validity_period: true,
          mt_http_bulk: false,
          mt_hex_content: true,
          created_at: realtimeUser.timestamp,
          updated_at: realtimeUser.timestamp,
        } as SmppUserWithBase);
      } else {
        // Update existing user with real-time data
        merged[existingIndex] = {
          ...merged[existingIndex],
          is_online: realtimeUser.is_online || false,
          last_connected_at: realtimeUser.last_connected_at,
          last_ip_address: realtimeUser.last_ip_address,
          connection_count: realtimeUser.connection_count || merged[existingIndex].connection_count,
          total_messages_sent: realtimeUser.total_messages_sent || merged[existingIndex].total_messages_sent,
          total_messages_received: realtimeUser.total_messages_received || merged[existingIndex].total_messages_received
        };
      }
    });
    
    return merged;
  }, [smppUsers, realtimeSmppUsers]);

  // Filter and search
  const filteredSmppUsers = useMemo(() => {
    return combinedSmppUsers.filter(smppUser => {
      const matchesSearch = searchTerm === '' ||
        (smppUser.system_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (smppUser.last_ip_address?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'online' && smppUser.is_online) ||
        (statusFilter === 'offline' && !smppUser.is_online);

      return matchesSearch && matchesStatus;
    });
  }, [combinedSmppUsers, searchTerm, statusFilter]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const onlineCount = combinedSmppUsers.filter(s => s.is_online).length;
    const offlineCount = combinedSmppUsers.filter(s => !s.is_online).length;
    return [...new Set([...combinedSmppUsers.map(s => s.is_online ? 'ONLINE' : 'OFFLINE'), 'ALL'])];
  }, [combinedSmppUsers]);

  // Stats
  const stats = useMemo(() => {
    const total = combinedSmppUsers.length;
    const active = combinedSmppUsers.filter(s => s.is_online).length;
    const inactive = combinedSmppUsers.filter(s => !s.is_online).length;
    const totalConnections = combinedSmppUsers.reduce((sum, user) => sum + user.connection_count, 0);
    const totalMessagesSent = combinedSmppUsers.reduce((sum, user) => sum + user.total_messages_sent, 0);
    const totalMessagesReceived = combinedSmppUsers.reduce((sum, user) => sum + user.total_messages_received, 0);
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      total,
      active,
      inactive,
      totalConnections,
      totalMessagesSent,
      totalMessagesReceived,
      activePercentage
    };
  }, [combinedSmppUsers]);

  // Handle delete
  const handleDelete = useCallback(async (smppUser: SmppUserWithBase) => {
    try {
      await smppUsersService.deleteSmppUser(smppUser.id);
      toast.success('SMPP user deleted successfully');
      fetchSmppUsers();
    } catch (error) {
      console.error('Error deleting SMPP user:', error);
      toast.error('Failed to delete SMPP user');
    }
  }, [fetchSmppUsers]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  // TanStack Table columns
  const columns = useMemo<ColumnDef<SmppUserWithBase>[]>(() => [
    createIdColumn<SmppUserWithBase>(),
    {
      accessorKey: 'system_id',
      header: 'System ID',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('system_id')}</div>
      ),
    },
    {
      accessorKey: 'is_online',
      header: 'Status',
      cell: ({ row }) => {
        const isOnline = row.getValue('is_online') as boolean;
        const isActive = row.getValue('is_active') as boolean;
        
        if (!isActive) {
          return <Badge variant="destructive">INACTIVE</Badge>;
        }
        
        return (
          <Badge variant={isOnline ? 'default' : 'secondary'}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'max_connection_speed',
      header: 'Max Connections',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue('max_connection_speed')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'connection_count',
      header: 'Connections',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue('connection_count')}
        </div>
      ),
    },
    {
      accessorKey: 'total_messages_sent',
      header: 'Sent',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue('total_messages_sent')}
        </div>
      ),
    },
    {
      accessorKey: 'total_messages_received',
      header: 'Received',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.getValue('total_messages_received')}
        </div>
      ),
    },
    {
      accessorKey: 'last_ip_address',
      header: 'Last IP',
      cell: ({ row }) => {
        const ip = row.getValue('last_ip_address') as string;
        return (
          <div className="font-mono text-sm">
            {ip || '-'}
          </div>
        );
      },
    },
    {
      accessorKey: 'last_connected_at',
      header: 'Last Connected',
      cell: ({ row }) => {
        const date = row.getValue('last_connected_at') as string;
        return (
          <div className="text-sm">
            {date ? new Date(date).toLocaleString() : '-'}
          </div>
        );
      },
    },
    createCreatedAtColumn<SmppUserWithBase>(),
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const smppUser = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link to={`/smpp-users/${smppUser.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(smppUser)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">SMPP Users</h1>
            <p className="text-muted-foreground">Manage SMPP protocol users and connections</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSmppUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/smpp-users/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add SMPP User
              </Button>
            </Link>
          </div>
        </div>

        {/* SMPP Users Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SMPP Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All registered SMPP users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[60px]">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${(stats.active / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{stats.activePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Disabled SMPP users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative min-w-[200px]">
                <Input
                  placeholder="Search SMPP users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 min-w-[120px] px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.toUpperCase()}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredSmppUsers}
          title="SMPP Users"
          description={`Showing ${filteredSmppUsers.length} of ${smppUsers.length} SMPP users`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 