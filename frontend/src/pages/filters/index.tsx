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

import { Search, Plus, RefreshCw, Filter as FilterIcon, CheckCircle, XCircle, Activity } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { filtersService, type Filter } from '@/services/filters';

interface FilterWithBase extends Filter, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Filters', href: '/filters' },
];

export default function FiltersIndex() {
  const { token } = useAuthStore();
  const [filters, setFilters] = useState<FilterWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');


  // Fetch filters from API
  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await filtersService.getFilters();
      
      // Transform data to include BaseRecord properties
      const transformedData: FilterWithBase[] = data.filters.map(filter => ({
        ...filter,
        id: filter.id,
        created_at: filter.created_at,
        updated_at: filter.updated_at,
      }));
      
      setFilters(transformedData);
    } catch (error) {
      console.error('Error fetching filters:', error);
      toast.error('Failed to fetch filters');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  // Filtered filters
  const filteredFilters = useMemo(() => {
    return filters.filter(filter => {
      const matchesSearch = searchTerm === '' || 
        filter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filter.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'all' || filter.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && filter.is_active) ||
        (statusFilter === 'inactive' && !filter.is_active);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filters, searchTerm, typeFilter, statusFilter]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = filters.map(f => f.type).filter(Boolean);
    return [...new Set(types)];
  }, [filters]);

  // Filters statistics
  const filterStats = useMemo(() => {
    const total = filters.length;
    const active = filters.filter(f => f.is_active).length;
    const inactive = filters.filter(f => !f.is_active).length;
    const smsFilters = filters.filter(f => f.type === 'sms').length;
    const ussdFilters = filters.filter(f => f.type === 'ussd').length;
    const deviceFilters = filters.filter(f => f.type === 'device').length;
    
    return {
      total,
      active,
      inactive,
      smsFilters,
      ussdFilters,
      deviceFilters,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }, [filters]);

  // Handle delete
  const handleDelete = useCallback(async (filter: FilterWithBase) => {
    try {
      await filtersService.deleteFilter(filter.id);
      toast.success('Filter deleted successfully');
      fetchFilters();
    } catch (error) {
      console.error('Error deleting filter:', error);
      toast.error('Failed to delete filter');
    }
  }, [fetchFilters]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  }, []);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.getValue('description') || 'No description',
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const getTypeVariant = (type: string) => {
          switch (type) {
            case 'sms': return 'default';
            case 'ussd': return 'secondary';
            case 'device': return 'outline';
            default: return 'secondary';
          }
        };
        
        return (
          <Badge variant={getTypeVariant(type)}>
            {type.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                ACTIVE
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                INACTIVE
              </>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'conditions',
      header: 'Conditions',
      cell: ({ row }) => {
        const conditions = row.getValue('conditions') as any;
        const conditionCount = conditions ? Object.keys(conditions).length : 0;
        return (
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{conditionCount} condition{conditionCount !== 1 ? 's' : ''}</span>
          </div>
        );
      },
    },
    createCreatedAtColumn<FilterWithBase>(),
    createActionsColumn<FilterWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/filters/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this filter?",
    }),
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Filters</h1>
            <p className="text-muted-foreground">Manage data filtering rules and conditions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchFilters}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/filters/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Filter
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Statistics Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Filters</CardTitle>
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filterStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All filters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Filters</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{filterStats.active}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-[60px]">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${filterStats.activePercentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{filterStats.activePercentage}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Filters</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{filterStats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Disabled filters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Filters</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{filterStats.smsFilters}</div>
              <p className="text-xs text-muted-foreground">
                SMS type filters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USSD Filters</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{filterStats.ussdFilters}</div>
              <p className="text-xs text-muted-foreground">
                USSD type filters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Filters</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{filterStats.deviceFilters}</div>
              <p className="text-xs text-muted-foreground">
                Device type filters
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
                  placeholder="Search filters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 min-w-[120px] px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 min-w-[120px] px-3 py-1 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
          data={filteredFilters}
          title="Filters"
          description={`Showing ${filteredFilters.length} of ${filters.length} filters`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 