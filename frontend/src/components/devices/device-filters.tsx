import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, RefreshCw } from 'lucide-react';

interface DeviceFiltersProps {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  countrySiteFilter: string;
  setCountrySiteFilter: (value: string) => void;
  deviceGroupFilter: string;
  setDeviceGroupFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onlineFilter: string;
  setOnlineFilter: (value: string) => void;
  maintenanceFilter: string;
  setMaintenanceFilter: (value: string) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  countrySites: string[];
  deviceGroups: string[];
  loading?: boolean;
}

export function DeviceFilters({
  globalFilter,
  setGlobalFilter,
  countrySiteFilter,
  setCountrySiteFilter,
  deviceGroupFilter,
  setDeviceGroupFilter,
  statusFilter,
  setStatusFilter,
  onlineFilter,
  setOnlineFilter,
  maintenanceFilter,
  setMaintenanceFilter,
  onClearFilters,
  onRefresh,
  countrySites,
  deviceGroups,
  loading = false
}: DeviceFiltersProps) {
  const hasActiveFilters = 
    globalFilter || 
    countrySiteFilter !== 'all' || 
    deviceGroupFilter !== 'all' || 
    statusFilter !== 'all' || 
    onlineFilter !== 'all' || 
    maintenanceFilter !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Device Filters
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Global Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search devices..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Site Name Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Site Name</label>
            <Select value={countrySiteFilter} onValueChange={setCountrySiteFilter} disabled={loading}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={loading ? "Loading..." : "All sites"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sites</SelectItem>
                {countrySites.map((sitename) => (
                  <SelectItem key={sitename} value={sitename}>
                    {sitename}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device Group Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Device Group</label>
            <Select value={deviceGroupFilter} onValueChange={setDeviceGroupFilter} disabled={loading}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={loading ? "Loading..." : "All groups"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                {deviceGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="alarm">Alarm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Online Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Online Status</label>
            <Select value={onlineFilter} onValueChange={setOnlineFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Maintenance Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Maintenance</label>
            <Select value={maintenanceFilter} onValueChange={setMaintenanceFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="maintenance">In Maintenance</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 