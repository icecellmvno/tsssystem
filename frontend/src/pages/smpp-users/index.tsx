import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, Wifi, WifiOff, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { apiClient } from '@/services/api-client';
import type { SmppUser } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SMPP Users',
        href: '/smpp-users',
    },
];

export default function SmppUsersIndex() {

  const [searchParams, setSearchParams] = useSearchParams();
  
  const [smppUsers, setSmppUsers] = useState({
    data: [] as SmppUser[],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    links: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [onlineFilter, setOnlineFilter] = useState(searchParams.get('is_online') || 'all');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('is_active') || 'all');

  // Fetch SMPP users data
  const fetchSmppUsers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (onlineFilter && onlineFilter !== 'all') params.is_online = onlineFilter;
      if (activeFilter && activeFilter !== 'all') params.is_active = activeFilter;
      
      const data = await apiClient.get<{
        data: SmppUser[];
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
        };
      }>('/smpp-users', params);
      setSmppUsers({
        data: data.data,
        current_page: data.meta.current_page,
        last_page: data.meta.last_page,
        per_page: data.meta.per_page,
        total: data.meta.total,
        links: [],
      });
    } catch (error) {
      console.error('Error fetching SMPP users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSmppUsers();
  }, [search, onlineFilter, activeFilter]);

  // Listen for realtime SMPP user status updates
  useEffect(() => {
    const handleSmppUserStatusUpdate = (event: CustomEvent) => {
      const updateData = event.detail;
      console.log('Realtime SMPP user status update:', updateData);
      
      // Update the user in the current list
      setSmppUsers(prev => ({
        ...prev,
        data: prev.data.map(user => {
          if (user.system_id === updateData.system_id) {
            return {
              ...user,
              is_online: updateData.is_online,
              last_connected_at: updateData.is_online ? updateData.timestamp : user.last_connected_at,
              last_disconnected_at: !updateData.is_online ? updateData.timestamp : user.last_disconnected_at,
              last_ip_address: updateData.is_online ? updateData.remote_addr : user.last_ip_address,
            };
          }
          return user;
        })
      }));
    };

    // Add event listener
    window.addEventListener('smpp-user-status-update', handleSmppUserStatusUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('smpp-user-status-update', handleSmppUserStatusUpdate as EventListener);
    };
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (onlineFilter && onlineFilter !== 'all') params.append('is_online', onlineFilter);
    if (activeFilter && activeFilter !== 'all') params.append('is_active', activeFilter);
    
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearch('');
    setOnlineFilter('all');
    setActiveFilter('all');
    setSearchParams({});
  };

  const handleDelete = async (smppUser: SmppUser) => {
    if (confirm('Are you sure you want to delete this SMPP User?')) {
      try {
        await apiClient.delete(`/smpp-users/${smppUser.id}`);
        // Refresh the data
        fetchSmppUsers();
      } catch (error) {
        console.error('Error deleting SMPP user:', error);
      }
    }
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

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SMPP Users</h1>
              <p className="text-muted-foreground">Manage SMPP users</p>
            </div>
            <Link to="/smpp-users/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add SMPP User
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by System ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Online</SelectItem>
                    <SelectItem value="0">Offline</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Active</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SMPP Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>SMPP Users ({smppUsers.total})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System ID</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MT Source Address</TableHead>
                    <TableHead>Last Connected</TableHead>
                    <TableHead>Last IP</TableHead>
                    <TableHead>Max Speed</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smppUsers.data.map((smppUser) => (
                    <TableRow key={smppUser.id}>
                      <TableCell className="font-mono text-sm">{smppUser.system_id}</TableCell>
                      <TableCell className="font-mono text-sm">{smppUser.password}</TableCell>
                      <TableCell>{getActiveBadge(smppUser.is_active)}</TableCell>
                      <TableCell>{getStatusBadge(smppUser.is_online)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {smppUser.mt_src_addr || 'None'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(smppUser.last_connected_at || null)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {smppUser.last_ip_address || '-'}
                      </TableCell>
                      <TableCell>{smppUser.max_connection_speed} msg/sec</TableCell>
                      <TableCell className="text-sm">
                        {new Date(smppUser.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link to={`/smpp-users/${smppUser.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/smpp-users/${smppUser.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(smppUser)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {smppUsers?.data?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No SMPP users found.
                </div>
              )}

              {/* Pagination */}
              {smppUsers.last_page > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((smppUsers.current_page - 1) * smppUsers.per_page) + 1} to{' '}
                    {Math.min(smppUsers.current_page * smppUsers.per_page, smppUsers.total)} of{' '}
                    {smppUsers.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (search) params.append('search', search);
                        if (onlineFilter && onlineFilter !== 'all') params.append('is_online', onlineFilter);
                        if (activeFilter && activeFilter !== 'all') params.append('is_active', activeFilter);
                        params.append('page', (smppUsers.current_page - 1).toString());
                        setSearchParams(params);
                      }}
                      disabled={smppUsers.current_page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {smppUsers.current_page} of {smppUsers.last_page}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (search) params.append('search', search);
                        if (onlineFilter && onlineFilter !== 'all') params.append('is_online', onlineFilter);
                        if (activeFilter && activeFilter !== 'all') params.append('is_active', activeFilter);
                        params.append('page', (smppUsers.current_page + 1).toString());
                        setSearchParams(params);
                      }}
                      disabled={smppUsers.current_page === smppUsers.last_page}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 