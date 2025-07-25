import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Trash2, Filter, Route, Calendar, Clock, Tag, Code, User, Users, MessageSquare, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/services/api-client';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Filters',
        href: '/filters',
    },
    {
        title: 'Details',
        href: '/filters/:id',
    },
];

const filterTypes = [
    { value: 'TransparentFilter', label: 'Transparent Filter', icon: Filter, description: 'Always matches any message criteria', routes: 'All' },
    { value: 'ConnectorFilter', label: 'Connector Filter', icon: Route, description: 'Matches the source connector of a message', routes: 'MO' },
    { value: 'UserFilter', label: 'User Filter', icon: User, description: 'Matches the owner of a MT message', routes: 'MT' },
    { value: 'GroupFilter', label: 'Group Filter', icon: Users, description: 'Matches the owner\'s group of a MT message', routes: 'MT' },
    { value: 'SourceAddrFilter', label: 'Source Address Filter', icon: MessageSquare, description: 'Matches the source address of a MO message', routes: 'All' },
    { value: 'DestinationAddrFilter', label: 'Destination Address Filter', icon: MessageSquare, description: 'Matches the destination address of a MT message', routes: 'All' },
    { value: 'ShortMessageFilter', label: 'Short Message Filter', icon: MessageSquare, description: 'Matches the content of a message', routes: 'All' },
    { value: 'DateIntervalFilter', label: 'Date Interval Filter', icon: Calendar, description: 'Matches the date of a message', routes: 'All' },
    { value: 'TimeIntervalFilter', label: 'Time Interval Filter', icon: Clock, description: 'Matches the time of a message', routes: 'All' },
    { value: 'TagFilter', label: 'Tag Filter', icon: Tag, description: 'Checks if message has a defined tag', routes: 'All' },
    { value: 'EvalPyFilter', label: 'Python Script Filter', icon: Code, description: 'Passes message to a third party python script for user-defined filtering', routes: 'All' },
];

interface FilterItem {
    id: number;
    name: string;
    type: string;
    description: string;
    is_active: boolean;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export default function FiltersShow() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFilter = async () => {
            if (!id) return;
            
            setIsLoading(true);
            try {
                const data = await apiClient.get<FilterItem>(`/filters/${id}`);
                setFilter(data);
            } catch (error) {
                console.error('Error fetching filter:', error);
                setError('Failed to fetch filter details');
                toast.error('Failed to fetch filter details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFilter();
    }, [id]);

    const deleteFilter = async () => {
        if (!filter) return;
        
        if (!confirm('Are you sure you want to delete this filter?')) return;
        
        try {
            await apiClient.delete(`/filters/${filter.id}`);
            toast.success('Filter deleted successfully');
            navigate('/filters');
        } catch (error) {
            console.error('Error deleting filter:', error);
            toast.error('Failed to delete filter');
        }
    };

    const getFilterTypeInfo = (type: string) => {
        return filterTypes.find(ft => ft.value === type) || {
            label: type,
            icon: Filter,
            description: 'Unknown filter type',
            routes: 'Unknown'
        };
    };

    const getRouteBadgeVariant = (routes: string) => {
        switch (routes) {
            case 'All':
                return 'default';
            case 'MO':
                return 'secondary';
            case 'MT':
                return 'outline';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderConfigDetails = () => {
        if (!filter || !filter.config || Object.keys(filter.config).length === 0) {
            return (
                <div className="text-muted-foreground">
                    No configuration details available
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {Object.entries(filter.config).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                        <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-right max-w-xs break-words">
                            {typeof value === 'string' && value.length > 100 ? (
                                <div>
                                    <div className="mb-2">{value.substring(0, 100)}...</div>
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                            Show full content
                                        </summary>
                                        <pre className="mt-2 p-2 bg-muted rounded text-xs whitespace-pre-wrap">
                                            {value}
                                        </pre>
                                    </details>
                                </div>
                            ) : (
                                <span>{String(value)}</span>
                            )}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p>Loading filter details...</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (error || !filter) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || 'Filter not found'}
                        </AlertDescription>
                    </Alert>
                    <Link to="/filters">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Filters
                        </Button>
                    </Link>
                </div>
            </AppLayout>
        );
    }

    const typeInfo = getFilterTypeInfo(filter.type);
    const IconComponent = typeInfo.icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/filters">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Filters
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{filter.name}</h1>
                            <p className="text-muted-foreground">
                                Filter details and configuration
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={`/filters/${filter.id}/edit`}>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Filter
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={deleteFilter}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Name:</span>
                                <span>{filter.name}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Type:</span>
                                <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{typeInfo.label}</span>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Routes:</span>
                                <Badge variant={getRouteBadgeVariant(typeInfo.routes)}>
                                    {typeInfo.routes}
                                </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="font-medium">Status:</span>
                                <Badge variant={filter.is_active ? 'default' : 'secondary'}>
                                    {filter.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            
                            <Separator />
                            
                            <div>
                                <span className="font-medium block mb-2">Description:</span>
                                <p className="text-muted-foreground">
                                    {filter.description || 'No description provided'}
                                </p>
                            </div>
                            
                            <div>
                                <span className="font-medium block mb-2">Type Description:</span>
                                <p className="text-muted-foreground">
                                    {typeInfo.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderConfigDetails()}
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Timestamps</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="font-medium block mb-2">Created:</span>
                                    <p className="text-muted-foreground">
                                        {formatDate(filter.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium block mb-2">Last Updated:</span>
                                    <p className="text-muted-foreground">
                                        {formatDate(filter.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 