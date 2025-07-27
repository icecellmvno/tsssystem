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

import { Search, Plus, RefreshCw, Signal, Wifi, CreditCard, Smartphone } from 'lucide-react';
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


  // Fetch SIM cards from API
  const fetchSimCards = useCallback(async () => {
    try {
      setLoading(true);
      const data = await simCardsService.getSimCards();
      
      // Transform data to include BaseRecord properties
      const transformedData: SimCardWithBase[] = data.sim_cards.map(simCard => ({
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
        simCard.msisdn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        simCard.operator.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || simCard.status === statusFilter;
      const matchesOperator = operatorFilter === 'all' || simCard.operator === operatorFilter;
      
      return matchesSearch && matchesStatus && matchesOperator;
    });
  }, [simCards, searchTerm, statusFilter, operatorFilter]);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = simCards.map(s => s.status).filter(Boolean);
    return [...new Set(statuses)];
  }, [simCards]);

  const uniqueOperators = useMemo(() => {
    const operators = simCards.map(s => s.operator).filter(Boolean);
    return [...new Set(operators)];
  }, [simCards]);

  // SIM card statistics
  const simCardStats = useMemo(() => {
    const total = simCards.length;
    const active = simCards.filter(s => s.status === 'active').length;
    const inactive = simCards.filter(s => s.status === 'inactive').length;
    const totalBalance = simCards.reduce((sum, s) => sum + (s.balance || 0), 0);
    const totalDataUsage = simCards.reduce((sum, s) => sum + (s.data_usage || 0), 0);
    const totalSmsUsage = simCards.reduce((sum, s) => sum + (s.sms_usage || 0), 0);
    
    return {
      total,
      active,
      inactive,
      totalBalance,
      totalDataUsage,
      totalSmsUsage,
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
      accessorKey: 'msisdn',
      header: 'MSISDN',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('msisdn')}</div>
      ),
    },
    {
      accessorKey: 'operator',
      header: 'Operator',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4 text-muted-foreground" />
          <span>{row.getValue('operator')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ row }) => row.getValue('country'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'balance',
      header: 'Balance',
      cell: ({ row }) => {
        const balance = row.getValue('balance') as number;
        return (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">${balance.toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'data_usage',
      header: 'Data Usage',
      cell: ({ row }) => {
        const dataUsage = row.getValue('data_usage') as number;
        return (
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span>{dataUsage} MB</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'sms_usage',
      header: 'SMS Usage',
      cell: ({ row }) => {
        const smsUsage = row.getValue('sms_usage') as number;
        return (
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span>{smsUsage}</span>
          </div>
        );
      },
    },
    createCreatedAtColumn<SimCardWithBase>(),
    createActionsColumn<SimCardWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/sim-cards/${record.id}/edit`,
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
            <Link to="/sim-cards/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add SIM Card
              </Button>
            </Link>
          </div>
        </div>

        {/* SIM Card Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              <CardTitle className="text-sm font-medium">Total Data Usage</CardTitle>
              <Wifi className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{simCardStats.totalDataUsage} MB</div>
              <p className="text-xs text-muted-foreground">
                Combined data usage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total SMS Usage</CardTitle>
              <Smartphone className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{simCardStats.totalSmsUsage}</div>
              <p className="text-xs text-muted-foreground">
                Combined SMS usage
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
