import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from 'sonner';
import { Plus, Search, QrCode, Edit, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type DeviceGroup, type DeviceGroupFilters } from '@/services/device-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useDeviceGroupsStore } from '@/stores/device-groups-store';
import QRCodeComponent from '@/components/ui/qr-code';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { DataTableViewOptions } from '@/components/ui/data-table-view-options';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';





export default function DeviceGroupsIndex() {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState('')
    const [selectedSitename, setSelectedSitename] = useState<string>('all');
    const [selectedDeviceGroup, setSelectedDeviceGroup] = useState<DeviceGroup | null>(null);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [copiedApiKey, setCopiedApiKey] = useState<string | null>(null);

    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Use store
    const { 
        deviceGroups, 
        sitenames, 
        websocketConfig,
        loading, 
        error,
        loadDeviceGroups, 
        loadSitenames, 
        loadWebsocketConfig,
        deleteDeviceGroup: deleteDeviceGroupFromStore 
    } = useDeviceGroupsStore();

    // Permission checks
    const canCreate = user?.role === 'admin';
    const canEdit = user?.role === 'admin';
    const canDelete = user?.role === 'admin';
    const canView = true; // All authenticated users can view



    // Load data on mount and when dependencies change
    useEffect(() => {
        const filters: DeviceGroupFilters = {
            search: undefined,
            sitename_id: selectedSitename === 'all' ? undefined : parseInt(selectedSitename),
            sort_by: sorting.length > 0 ? sorting[0].id : 'created_at',
            sort_order: sorting.length > 0 ? sorting[0].desc ? 'desc' : 'asc' : 'desc',
            page: 1,
            per_page: 50,
        };
        loadDeviceGroups(filters);
    }, [selectedSitename, sorting, loadDeviceGroups]);

    useEffect(() => {
        loadSitenames();
        loadWebsocketConfig();
    }, [loadSitenames, loadWebsocketConfig]);

    const handleDelete = useCallback(async (id: number) => {
        try {
            await deleteDeviceGroupFromStore(id);
            toast.success('Device group deleted successfully');
        } catch (error) {
            console.error('Error deleting device group:', error);
            toast.error('Failed to delete device group');
        }
    }, [deleteDeviceGroupFromStore]);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedApiKey(text);
            toast.success('API key copied to clipboard');
            setTimeout(() => setCopiedApiKey(null), 2000);
        } catch (error) {
            toast.error('Failed to copy API key');
        }
    }, []);

    const columns: ColumnDef<DeviceGroup>[] = [
        {
            accessorKey: "device_group",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("device_group")}</div>
            ),
        },
        {
            accessorKey: "sitename",
            header: "Sitename",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue("sitename") || 'N/A'}
                </div>
            ),
        },
        {
            accessorKey: "device_type",
            header: "Device Type",
            cell: ({ row }) => {
                const deviceType = row.getValue("device_type") as string;
                return (
                    <Badge variant="outline">
                        {deviceType === 'android' ? 'Android' : deviceType === 'usb_modem' ? 'USB Modem' : deviceType}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                
                let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
                let displayStatus = status;
                
                switch (status) {
                    case 'active':
                        variant = 'default';
                        displayStatus = 'Active';
                        break;
                    case 'inactive':
                        variant = 'secondary';
                        displayStatus = 'Inactive';
                        break;
                    case 'maintenance':
                        variant = 'destructive';
                        displayStatus = 'Maintenance';
                        break;
                    case 'configured':
                        variant = 'secondary';
                        displayStatus = 'Configured';
                        break;
                    case 'incomplete':
                        variant = 'destructive';
                        displayStatus = 'Incomplete';
                        break;
                    default:
                        variant = 'secondary';
                        displayStatus = 'Unknown';
                }
                
                return (
                    <Badge variant={variant}>
                        {displayStatus}
                    </Badge>
                );
            },
        },
        {
            accessorKey: "queue_name",
            header: "Queue",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue("queue_name") || 'N/A'}
                </div>
            ),
        },
        {
            accessorKey: "api_key",
            header: "API Key",
            cell: ({ row }) => {
                const apiKey = row.getValue("api_key") as string;
                return (
                    <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                            {apiKey ? `${apiKey.slice(0, 8)}...` : 'N/A'}
                        </code>
                        {apiKey && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(apiKey)}
                                title="Copy API Key"
                            >
                                <Search className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            id: "active_alarms",
            header: "Alarms",
            cell: ({ row }) => {
                const deviceGroup = row.original;
                const activeAlarms = [
                    deviceGroup.enable_battery_alarms,
                    deviceGroup.enable_error_alarms,
                    deviceGroup.enable_offline_alarms,
                    deviceGroup.enable_signal_alarms,
                    deviceGroup.enable_sim_balance_alarms
                ].filter(Boolean).length;
                
                return (
                    <div className="text-sm">
                        {activeAlarms} active
                    </div>
                );
            },
        },
        {
            accessorKey: "low_balance_threshold",
            header: "Thresholds",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue("low_balance_threshold") || 'N/A'}
                </div>
            ),
        },
        {
            id: "sms_limit",
            header: "SMS Limits",
            cell: ({ row }) => {
                const deviceGroup = row.original;
                return (
                    <div className="text-sm text-muted-foreground">
                        {deviceGroup.enable_sms_limits ? 'Enabled' : 'Unlimited'}
                    </div>
                );
            },
        },
        {
            id: "auto_actions",
            header: "Auto Actions",
            cell: ({ row }) => {
                const deviceGroup = row.original;
                return (
                    <div className="flex gap-1">
                        {deviceGroup.auto_disable_sim_on_alarm ? (
                            <Badge variant="outline" className="text-xs">
                                Enabled
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-xs">
                                Disabled
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const deviceGroup = row.original

                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedDeviceGroup(deviceGroup);
                                setShowQRDialog(true);
                            }}
                            title="QR Code"
                        >
                            <QrCode className="h-4 w-4" />
                        </Button>
                        {canEdit && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/device-groups/${deviceGroup.id}/edit`)}
                                title="Edit"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        title="Delete"
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Device Group</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to delete "{deviceGroup.device_group}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(deviceGroup.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: deviceGroups,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
        globalFilterFn: 'includesString',
    })

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Device Groups</h1>
                        <p className="text-muted-foreground">
                            Manage device groups and their configurations
                        </p>
                    </div>
                    {canCreate && (
                        <Button onClick={() => navigate('/device-groups/create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Device Group
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            Search & Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search device groups..."
                                    value={globalFilter ?? ""}
                                    onChange={(event) => setGlobalFilter(event.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <Select value={selectedSitename} onValueChange={setSelectedSitename}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by sitename" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sitenames</SelectItem>
                                    {sitenames.length > 0 ? (
                                        sitenames.map((sitename) => (
                                            <SelectItem key={sitename.id} value={sitename.id.toString()}>
                                                {sitename.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="loading" disabled>
                                            Loading sitenames...
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <DataTableViewOptions table={table} />
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <DataTablePagination table={table} />
                        </div>
                    </CardContent>
                </Card>

                {/* QR Code Dialog */}
                {selectedDeviceGroup && (
                    <AlertDialog open={showQRDialog} onOpenChange={setShowQRDialog}>
                        <AlertDialogContent className="max-w-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>QR Code for {selectedDeviceGroup.device_group}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Scan this QR code to connect your device to this group. This QR code contains all the necessary configuration for your device.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                                                            <div className="space-y-4">
                                    <div className="flex justify-center py-4">
                                        <QRCodeComponent
                                            value={JSON.stringify({
                                                device_group: selectedDeviceGroup.device_group,
                                                sitename: selectedDeviceGroup.sitename,
                                                websocket_url: (websocketConfig?.device_websocket_url || 'ws://localhost:7001/ws') + '?type=android',
                                                api_key: selectedDeviceGroup.api_key,
                                            })}
                                            size={200}
                                        />
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-2">
                                        <div><strong>Device Group:</strong> {selectedDeviceGroup.device_group}</div>
                                        <div><strong>Sitename:</strong> {selectedDeviceGroup.sitename}</div>
                                        <div><strong>API Key:</strong> {selectedDeviceGroup.api_key}</div>
                                        <div><strong>WebSocket URL:</strong> {websocketConfig?.device_websocket_url || 'ws://localhost:7001/ws'} (Direct connection)</div>
                                    </div>
                                </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Close</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </AppLayout>
    );
} 