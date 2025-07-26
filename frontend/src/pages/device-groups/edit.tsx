import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Building2, ChevronLeft } from 'lucide-react';
import DeviceGroupForm from './device-group-form';
import { type DeviceGroup } from '@/services/device-groups';
import { useDeviceGroupsStore } from '@/stores/device-groups-store';
import { toast } from 'sonner';

export default function DeviceGroupEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [countrySites, setCountrySites] = useState<Array<{ id: number; country_site: string }>>([]);

    // Use store
    const { 
        currentDeviceGroup: deviceGroup, 
        countrySites: storeSitenames, 
        currentDeviceGroupLoading: loading, 
        currentDeviceGroupError: error,
        loadDeviceGroup, 
        loadCountrySites 
    } = useDeviceGroupsStore();

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]); // Remove loadDeviceGroup and loadCountrySites from dependencies

    const loadData = async () => {
        try {
            // Load device group and country sites in parallel
            await Promise.all([
                loadDeviceGroup(parseInt(id!)),
                loadCountrySites()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load device group data');
            navigate('/device-groups');
        }
    };

    // Transform country sites when store data changes
    useEffect(() => {
        if (storeSitenames.length > 0) {
            const transformedCountrySites = storeSitenames.map(sitename => ({
                id: sitename.id,
                country_site: sitename.name // Transform 'name' to 'country_site'
            }));
            setCountrySites(transformedCountrySites);
        }
    }, [storeSitenames]);

    const handleSuccess = () => {
        navigate('/device-groups');
    };

    // Show error if there's an error
    if (error) {
        return (
            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-destructive mb-4">{error}</p>
                            <Button onClick={() => navigate('/device-groups')} className="mt-4">
                                Back to Device Groups
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (loading) {
        return (
            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2 text-muted-foreground">Loading...</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!deviceGroup) {
        return (
            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <p className="text-muted-foreground">Device group not found</p>
                            <Button onClick={() => navigate('/device-groups')} className="mt-4">
                                Back to Device Groups
                            </Button>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/device-groups')}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Edit Device Group
                    </h1>
                </div>
                <DeviceGroupForm 
                    deviceGroup={deviceGroup}
                    countrySites={countrySites} 
                    onSuccess={handleSuccess}
                    onCancel={() => navigate('/device-groups')}
                />
            </div>
        </AppLayout>
    );
} 