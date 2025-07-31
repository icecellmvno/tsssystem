import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Search, RefreshCw, Signal, Wifi, CreditCard, Smartphone } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { simCardsService, type SimCard } from '@/services/sim-cards';

interface SimCardWithBase extends SimCard, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'SIM Cards', href: '/sim-cards' },
];

export default function SimCardsIndex() {
  const { token } = useAuthStore();
  const [simCards, setSimCards] = useState<SimCardWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [simCardStatusFilter, setSimCardStatusFilter] = useState('all');


  // Fetch SIM cards from API
  const fetchSimCards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await simCardsService.getSimCards();
      
      // Backend returns { data: SimCard[] } format
      const simCardsData = response.data || [];
      
      // Transform data to include BaseRecord properties
      const transformedData: SimCardWithBase[] = simCardsData.map(simCard => ({
        ...simCard,
        id: simCard.id,
        created_at: simCard.created_at,
        updated_at: simCard.updated_at,
      }));
      
      setSimCards(transformedData);
    } catch (error) {
      console.error('Error fetching SIM cards:', error);
      toast.error('Failed to fetch SIM cards');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSimCards();
  }, [fetchSimCards]);

  // Filtered SIM cards
  const filteredSimCards = useMemo(() => {
    return simCards.filter(simCard => {
      const matchesSearch = searchTerm === '' || 
        simCard.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.iccid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.carrier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.network_operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (simCard.device_name && simCard.device_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (simCard.device_model && simCard.device_model.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (simCard.device_group_name && simCard.device_group_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (simCard.country_site && simCard.country_site.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? simCard.is_active : !simCard.is_active);
      const matchesOperator = operatorFilter === 'all' || simCard.carrier_name === operatorFilter;
      const matchesSimCardStatus = simCardStatusFilter === 'all' || simCard.sim_card_status === simCardStatusFilter;
      
      return matchesSearch && matchesStatus && matchesOperator && matchesSimCardStatus;
    });
  }, [simCards, searchTerm, statusFilter, operatorFilter, simCardStatusFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    return ['active', 'inactive'];
  }, []);

  const uniqueOperators = useMemo(() => {
    const operators = simCards.map(s => s.carrier_name).filter(Boolean);
    return [...new Set(operators)];
  }, [simCards]);

  const uniqueSimCardStatuses = useMemo(() => {
    const statuses = simCards.map(s => s.sim_card_status).filter(Boolean);
    return [...new Set(statuses)];
  }, [simCards]);

  // SIM card statistics
  const simCardStats = useMemo(() => {
    const total = simCards.length;
    const active = simCards.filter(s => s.sim_card_status === 'Active').length;
    const good = simCards.filter(s => s.sim_card_status === 'Good').length;
    const noBalance = simCards.filter(s => s.sim_card_status === 'No Balance').length;
    const blocked = simCards.filter(s => s.sim_card_status === 'Blocked').length;
    const totalBalance = simCards.reduce((sum, s) => sum + (s.main_balance || 0), 0);
    const totalSmsBalance = simCards.reduce((sum, s) => sum + (s.sms_balance || 0), 0);
    const totalSmsSent = simCards.reduce((sum, s) => sum + (s.total_sent || 0), 0);
    
    return {
      total,
      active,
      good,
      noBalance,
      blocked,
      totalBalance,
      totalSmsBalance,
      totalSmsSent,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [simCards]);

  // Handle delete
  const handleDelete = useCallback(async (simCard: SimCardWithBase) => {
    try {
      await simCardsService.deleteSimCard(simCard.id);
      toast.success('SIM card deleted successfully');
      fetchSimCards();
    } catch (error) {
      console.error('Error deleting SIM card:', error);
      toast.error('Failed to delete SIM card');
    }
  }, [fetchSimCards]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setOperatorFilter('all');
    setSimCardStatusFilter('all');
  }, []);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'imei',
      header: 'IMEI',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('imei')}</div>
      ),
    },
    {
      accessorKey: 'iccid',
      header: 'ICCID',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('iccid')}</div>
      ),
    },
    {
      accessorKey: 'number',
      header: 'Number',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('number')}</div>
      ),
    },
    {
      accessorKey: 'device_name',
      header: 'Device Name',
      cell: ({ row }) => {
        const deviceName = row.getValue('device_name') as string;
        return (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{deviceName || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'device_model',
      header: 'Model',
      cell: ({ row }) => {
        const deviceModel = row.getValue('device_model') as string;
        return (
          <div className="text-sm text-muted-foreground">
            {deviceModel || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'device_group_name',
      header: 'Device Group',
      cell: ({ row }) => {
        const deviceGroupName = row.getValue('device_group_name') as string;
        return (
          <div className="text-sm">
            {deviceGroupName || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'country_iso',
      header: 'Country',
      cell: ({ row }) => row.getValue('country_iso'),
    },
    {
      accessorKey: 'country_site',
      header: 'Site',
      cell: ({ row }) => {
        const countrySite = row.getValue('country_site') as string;
        return (
          <div className="text-sm">
            {countrySite || 'N/A'}
          </div>
        );
      },
    },
    {
      accessorKey: 'carrier_name',
      header: 'Carrier',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue('carrier_name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sim_card_status',
      header: 'SIM Card Status',
      cell: ({ row }) => {
        const simCardStatus = row.getValue('sim_card_status') as string;
        const statusBadgeVariant = row.original.status_badge_variant as string;
        
        const getStatusVariant = (status: string) => {
          switch (status) {
            case 'Active':
              return 'default';
            case 'Good':
              return 'outline';
            case 'No Balance':
              return 'destructive';
            case 'Blocked':
              return 'destructive';
            default:
              return 'secondary';
          }
        };

        return (
          <Badge variant={getStatusVariant(simCardStatus)}>
            {simCardStatus || 'Unknown'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'main_balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = row.getValue('main_balance') as number;
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">${balance.toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'sms_balance',
      header: 'SMS Balance',
      cell: ({ row }) => {
        const smsBalance = row.getValue('sms_balance') as number;
        return (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span>{smsBalance}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'total_sent',
      header: 'SMS Sent',
      cell: ({ row }) => {
        const totalSent = row.getValue('total_sent') as number;
        return (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span>{totalSent}</span>
          </div>
        );
      },
    },
    createCreatedAtColumn<SimCardWithBase>(),
    createActionsColumn<SimCardWithBase>({
      onDelete: handleDelete,
      deleteConfirmMessage: "Are you sure you want to delete this SIM card?",
    }),
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">SIM Cards</h1>
            <p className="text-muted-foreground">Manage and monitor SIM card usage</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSimCards}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* SIM Card Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SIM Cards</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{simCardStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All registered SIM cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active SIM Cards</CardTitle>
              <Signal className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{simCardStats.active}</div>
              <div className="flex items-center gap-2">
                <Progress value={simCardStats.activePercentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{simCardStats.activePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Good SIM Cards</CardTitle>
              <Signal className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{simCardStats.good}</div>
              <p className="text-xs text-muted-foreground">
                Operational but offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{simCardStats.noBalance}</div>
              <p className="text-xs text-muted-foreground">
                SMS limit reached
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked SIM Cards</CardTitle>
              <Signal className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{simCardStats.blocked}</div>
              <p className="text-xs text-muted-foreground">
                Unable to send/receive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${simCardStats.totalBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Combined balance across all SIM cards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SMS Balance</CardTitle>
              <Smartphone className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{simCardStats.totalSmsBalance}</div>
              <p className="text-xs text-muted-foreground">
                Combined SMS balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SMS Sent</CardTitle>
              <Smartphone className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{simCardStats.totalSmsSent}</div>
              <p className="text-xs text-muted-foreground">
                Combined SMS sent
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
                  placeholder="Search SIM cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 min-w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                <SelectTrigger className="h-8 min-w-[150px]">
                  <SelectValue placeholder="All Operators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operators</SelectItem>
                  {uniqueOperators.map((operator) => (
                    <SelectItem key={operator} value={operator}>
                      {operator}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={simCardStatusFilter} onValueChange={setSimCardStatusFilter}>
                <SelectTrigger className="h-8 min-w-[150px]">
                  <SelectValue placeholder="All SIM Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SIM Status</SelectItem>
                  {uniqueSimCardStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
          data={filteredSimCards}
          title="SIM Cards"
          description={`Showing ${filteredSimCards.length} of ${simCards.length} SIM cards`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 
