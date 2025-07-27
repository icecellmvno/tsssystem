import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Search, QrCode, Edit, Trash2, Building2, Filter, RefreshCw } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type DeviceGroup, type DeviceGroupFilters } from '@/services/device-groups';
import { useAuthStore } from '@/stores/auth-store';
import { useDeviceGroupsStore } from '@/stores/device-groups-store';
import QRCodeComponent from '@/components/ui/qr-code';
import { DataTable } from '@/components/ui/data-table';
import { 
    createIdColumn, 
    createNameColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
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

interface DeviceGroupWithBase extends DeviceGroup, BaseRecord {}

export default function DeviceGroupsIndex() {
    const [selectedCountrySite, setSelectedCountrySite] = useState<string>('all');
    const [selectedDeviceGroup, setSelectedDeviceGroup] = useState<DeviceGroupWithBase | null>(null);
    const [showQRDialog, setShowQRDialog] = useState(false);
    const [copiedApiKey, setCopiedApiKey] = useState<string | null>(null);
    const [qrData, setQrData] = useState<string | null>(null);
    
    // Table states
    const [searchTerm, setSearchTerm] = useState('');

    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Use store
    const { 
        deviceGroups, 
        countrySites, 
        deviceGroupsLoading, 
        deviceGroupsError,
        loadDeviceGroups, 
        loadCountrySites, 
        deleteDeviceGroup: deleteDeviceGroupFromStore,
        generateQRCode
    } = useDeviceGroupsStore();

    // Permission checks
    const canCreate = user?.role === 'admin';
    const canEdit = user?.role === 'admin';
    const canDelete = user?.role === 'admin';
    const canView = true; // All authenticated users can view

    const fetchDeviceGroups = useCallback(async () => {
        try {
            console.log('Fetching device groups...');
            await loadDeviceGroups();
        } catch (error) {
            console.error('Error fetching device groups:', error);
            toast.error('Failed to fetch device groups');
        }
    }, [loadDeviceGroups]);

    // Load data on mount and when dependencies change
    useEffect(() => {
        fetchDeviceGroups();
    }, [fetchDeviceGroups]);

    // Load country sites on mount
    useEffect(() => {
        loadCountrySites();
    }, [loadCountrySites]);

    const handleDelete = useCallback(async (record: DeviceGroupWithBase) => {
        try {
            await deleteDeviceGroupFromStore(record.id);
            toast.success('Device group deleted successfully');
            fetchDeviceGroups(); // Reload the list
        } catch (error) {
            console.error('Error deleting device group:', error);
            toast.error('Failed to delete device group');
        }
    }, [deleteDeviceGroupFromStore, fetchDeviceGroups]);

    const handleSearch = (search: string) => {
        setSearchTerm(search);
    };

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

    // Define columns for TanStack Table
    const columns = [
        createIdColumn<DeviceGroupWithBase>(),
        {
            accessorKey: 'device_group',
            header: 'Name',
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue('device_group')}</div>
            )
        },
        {
            accessorKey: 'country_site',
            header: 'Country Site',
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue('country_site') || 'N/A'}
                </div>
            )
        },
        {
            accessorKey: 'device_type',
            header: 'Device Type',
            cell: ({ row }) => {
                const deviceType = row.getValue('device_type') as string;
                return (
                    <Badge variant="outline">
                        {deviceType === 'android' ? 'Android' : deviceType === 'usb_modem' ? 'USB Modem' : deviceType}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                
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
            }
        },
        {
            accessorKey: 'queue_name',
            header: 'Queue',
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue('queue_name') || 'N/A'}
                </div>
            )
        },
        {
            accessorKey: 'api_key',
            header: 'API Key',
            cell: ({ row }) => {
                const apiKey = row.getValue('api_key') as string;
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
            }
        },
        {
            id: 'active_alarms',
            header: 'Alarms',
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
            }
        },
        {
            accessorKey: 'low_balance_threshold',
            header: 'Thresholds',
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">
                    {row.getValue('low_balance_threshold') || 'N/A'}
                </div>
            )
        },
        {
            id: 'sms_limit',
            header: 'SMS Limits',
            cell: ({ row }) => {
                const deviceGroup = row.original;
                return (
                    <div className="text-sm text-muted-foreground">
                        {deviceGroup.enable_sms_limits ? 'Enabled' : 'Unlimited'}
                    </div>
                );
            }
        },
        {
            id: 'auto_actions',
            header: 'Auto Actions',
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
            }
        },
        createCreatedAtColumn<DeviceGroupWithBase>(),
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const deviceGroup = row.original;

                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                                try {
                                    const result = await generateQRCode(deviceGroup.id);
                                    if (result.success) {
                                        setQrData(result.qr_data);
                                        setSelectedDeviceGroup(deviceGroup);
                                        setShowQRDialog(true);
                                    }
                                } catch (error) {
                                    console.error('Error generating QR code:', error);
                                }
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
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Delete"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(deviceGroup)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                );
            }
        }
    ];

    if (deviceGroupsLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading device groups...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (deviceGroupsError) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-destructive">Error loading device groups: {deviceGroupsError}</p>
                        <Button onClick={() => fetchDeviceGroups()} className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const emptyState = (
        <div className="flex items-center justify-center py-8">
            <div className="text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-sm font-semibold">No device groups found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Get started by creating a new device group.
                </p>
                {canCreate && (
                    <Button onClick={() => navigate('/device-groups/create')} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Device Group
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout>
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Device Groups</h1>
                        <p className="text-muted-foreground">
                            Manage device groups and their configurations ({deviceGroups?.length || 0} total records)
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchDeviceGroups()}
                            disabled={deviceGroupsLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${deviceGroupsLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        {canCreate && (
                            <Button onClick={() => navigate('/device-groups/create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Device Group
                            </Button>
                        )}
                    </div>
                </div>

                {/* Country Site Warning */}
                {countrySites?.length === 0 && (
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-yellow-600" />
                                <div>
                                    <h3 className="font-semibold text-yellow-800">No Country Sites Available</h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        You need to create at least one country site before creating device groups. 
                                        Device groups must be associated with a country site.
                                    </p>
                                    <div className="mt-3">
                                        <Button 
                                            onClick={() => navigate('/countrysites/create')}
                                            size="sm"
                                            className="bg-yellow-600 hover:bg-yellow-700"
                                        >
                                            Create Country Site
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Search & Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search device groups..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Country Site</label>
                                <Select value={selectedCountrySite} onValueChange={setSelectedCountrySite}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by country site" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Country Sites</SelectItem>
                                        {countrySites?.length > 0 ? (
                                            countrySites.map((countrySite) => (
                                                <SelectItem key={countrySite.id} value={countrySite.id.toString()}>
                                                    {countrySite.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="loading" disabled>
                                                Loading country sites...
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <DataTable
                    columns={columns}
                    data={deviceGroups || []}
                    title="Device Groups"
                    description={`Showing ${deviceGroups?.length || 0} total records`}
                    emptyState={emptyState}
                    showSearch={false} // Disable built-in search since we have custom search
                    showViewOptions={true}
                    showPagination={true}
                    className="space-y-4"
                />

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
                                        value={qrData || ''}
                                        size={200}
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground space-y-2">
                                    <div><strong>Device Group:</strong> {selectedDeviceGroup.device_group}</div>
                                    <div><strong>Country Site:</strong> {selectedDeviceGroup.country_site}</div>
                                    <div><strong>API Key:</strong> <code className="text-xs">{selectedDeviceGroup.api_key}</code></div>
                                    <div><strong>WebSocket URL:</strong> <code className="text-xs">ws://192.168.9.24:7001/ws</code></div>
                                </div>
                                <div className="mt-4 p-3 bg-muted rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-2">QR Code contains:</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        <li>• Device group and country site information</li>
                                        <li>• API key for authentication</li>
                                        <li>• WebSocket URL for real-time communication</li>
                                    </ul>
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