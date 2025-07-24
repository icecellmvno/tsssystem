import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Building2, ChevronLeft } from 'lucide-react';
import DeviceGroupForm from './device-group-form';
import { apiClient } from '@/services/api-client';

interface Sitename {
    id: number;
    name: string;
}

export default function DeviceGroupCreate() {
    const navigate = useNavigate();
    const [sitenames, setSitenames] = useState<Sitename[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSitenames();
    }, []);

    const loadSitenames = async () => {
        try {
            const data = await apiClient.get<{ data: Sitename[] }>('/sitenames');
            setSitenames(data.data || []);
        } catch (error) {
            console.error('Error loading sitenames:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        navigate('/device-groups');
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={[
                { title: 'Site Management', href: '#' },
                { title: 'Device Groups', href: '/device-groups' },
                { title: 'Create', href: '/device-groups/create' },
            ]}>
                <div className="w-full px-4 py-8">
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

    return (
        <AppLayout breadcrumbs={[
            { title: 'Site Management', href: '#' },
            { title: 'Device Groups', href: '/device-groups' },
            { title: 'Create', href: '/device-groups/create' },
        ]}>
            <div className="w-full px-4 py-8">
                <div className="flex items-center gap-2 mb-6">
                    <Button variant="outline" size="sm" onClick={() => navigate('/device-groups')}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-primary" />
                        Create Device Group
                    </h1>
                </div>
                <DeviceGroupForm 
                    deviceGroup={null}
                    sitenames={sitenames.map(s => ({ id: s.id, sitename: s.name }))} 
                    onSuccess={handleSuccess}
                    onCancel={() => navigate('/device-groups')}
                />
            </div>
        </AppLayout>
    );
} 