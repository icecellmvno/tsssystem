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
              status: data.is_online ? 'active' : 'inactive',
              last_seen_at: data.timestamp,
              session_id: data.session_id,
              remote_addr: data.remote_addr,
              bind_type: data.bind_type
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
          username: realtimeUser.system_id,
          password: '', // Not available in real-time data
          system_type: realtimeUser.bind_type,
          interface_version: '', // Not available in real-time data
          addr_ton: 0, // Not available in real-time data
          addr_npi: 0, // Not available in real-time data
          address_range: '', // Not available in real-time data
          status: realtimeUser.is_online ? 'active' : 'inactive',
          max_connections: 0, // Not available in real-time data
          created_at: realtimeUser.timestamp,
          updated_at: realtimeUser.timestamp,
        } as SmppUserWithBase);
      } else {
        // Update existing user with real-time data
        merged[existingIndex] = { 
          ...merged[existingIndex], 
          status: realtimeUser.is_online ? 'active' : 'inactive',
          updated_at: realtimeUser.timestamp,
        };
      }
    });
    
    return merged;
  }, [smppUsers, realtimeSmppUsers]);

  // Filtered SMPP users
  const filteredSmppUsers = useMemo(() => {
    return combinedSmppUsers.filter(smppUser => {
      const matchesSearch = searchTerm === '' || 
        (smppUser.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (smppUser.system_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (smppUser.system_type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || smppUser.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [combinedSmppUsers, searchTerm, statusFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = combinedSmppUsers.map(s => s.status).filter(status => status && status !== '');
    return [...new Set(statuses)];
  }, [combinedSmppUsers]);

  // SMPP users statistics
  const smppUserStats = useMemo(() => {
    const total = combinedSmppUsers.length;
    const active = combinedSmppUsers.filter(s => s.status === 'active').length;
    const inactive = combinedSmppUsers.filter(s => s.status === 'inactive').length;
    
    return {
      total,
      active,
      inactive,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [smppUsers]);

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
  const columns = useMemo(() => [
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue('username')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'system_id',
      header: 'System ID',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('system_id')}</div>
      ),
    },
    {
      accessorKey: 'system_type',
      header: 'System Type',
      cell: ({ row }) => row.getValue('system_type'),
    },
    {
      accessorKey: 'interface_version',
      header: 'Interface Version',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue('interface_version')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusText = status || 'unknown';
        return (
          <Badge variant={statusText === 'active' ? 'default' : 'secondary'}>
            {statusText.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'max_connections',
      header: 'Max Connections',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue('max_connections')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'address_range',
      header: 'Address Range',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('address_range')}</div>
      ),
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
              <div className="text-2xl font-bold">{smppUserStats.total}</div>
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
              <div className="text-2xl font-bold text-green-600">{smppUserStats.active}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[60px]">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${smppUserStats.activePercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{smppUserStats.activePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <Activity className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{smppUserStats.inactive}</div>
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