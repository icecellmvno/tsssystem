import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save, AlertCircle, Filter, Route, Calendar, Clock, Tag, Code, User, Users, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/services/api-client';

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
        title: 'Create',
        href: '/filters/create',
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

export default function FiltersCreate() {
    const navigate = useNavigate();
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [data, setData] = useState({
        name: '',
        type: '',
        description: '',
        is_active: true,
        config: {} as Record<string, any>,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            await apiClient.post('/filters', data);
            navigate('/filters');
        } catch (error) {
            console.error('Error creating filter:', error);
            if (error instanceof Error) {
                setErrors({ general: error.message });
            }
        } finally {
            setProcessing(false);
        }
    };

    const getSelectedFilterType = () => {
        return filterTypes.find(ft => ft.value === data.type);
    };

    const renderConfigFields = () => {
        const selectedType = getSelectedFilterType();
        if (!selectedType) return null;

        switch (data.type) {
            case 'ConnectorFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="connector_id">Connector ID</Label>
                            <Input
                                id="connector_id"
                                type="text"
                                value={data.config.connector_id || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, connector_id: e.target.value }
                                })}
                                placeholder="Enter connector ID"
                            />
                        </div>
                    </div>
                );
            
            case 'UserFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="user_id">User ID</Label>
                            <Input
                                id="user_id"
                                type="text"
                                value={data.config.user_id || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, user_id: e.target.value }
                                })}
                                placeholder="Enter user ID"
                            />
                        </div>
                    </div>
                );
            
            case 'GroupFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="group_id">Group ID</Label>
                            <Input
                                id="group_id"
                                type="text"
                                value={data.config.group_id || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, group_id: e.target.value }
                                })}
                                placeholder="Enter group ID"
                            />
                        </div>
                    </div>
                );
            
            case 'SourceAddrFilter':
            case 'DestinationAddrFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="address">Address Pattern</Label>
                            <Input
                                id="address"
                                type="text"
                                value={data.config.address || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, address: e.target.value }
                                })}
                                placeholder="Enter address pattern (e.g., +1234567890 or regex)"
                            />
                        </div>
                    </div>
                );
            
            case 'ShortMessageFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="pattern">Message Pattern</Label>
                            <Textarea
                                id="pattern"
                                value={data.config.pattern || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, pattern: e.target.value }
                                })}
                                placeholder="Enter message pattern or regex"
                                rows={3}
                            />
                        </div>
                    </div>
                );
            
            case 'DateIntervalFilter':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={data.config.start_date || ''}
                                    onChange={(e) => setData({
                                        ...data,
                                        config: { ...data.config, start_date: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={data.config.end_date || ''}
                                    onChange={(e) => setData({
                                        ...data,
                                        config: { ...data.config, end_date: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                );
            
            case 'TimeIntervalFilter':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start_time">Start Time</Label>
                                <Input
                                    id="start_time"
                                    type="time"
                                    value={data.config.start_time || ''}
                                    onChange={(e) => setData({
                                        ...data,
                                        config: { ...data.config, start_time: e.target.value }
                                    })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="end_time">End Time</Label>
                                <Input
                                    id="end_time"
                                    type="time"
                                    value={data.config.end_time || ''}
                                    onChange={(e) => setData({
                                        ...data,
                                        config: { ...data.config, end_time: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                );
            
            case 'TagFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="tag">Tag</Label>
                            <Input
                                id="tag"
                                type="text"
                                value={data.config.tag || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, tag: e.target.value }
                                })}
                                placeholder="Enter tag name"
                            />
                        </div>
                    </div>
                );
            
            case 'EvalPyFilter':
                return (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="script_path">Python Script Path</Label>
                            <Input
                                id="script_path"
                                type="text"
                                value={data.config.script_path || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, script_path: e.target.value }
                                })}
                                placeholder="Enter path to Python script"
                            />
                        </div>
                        <div>
                            <Label htmlFor="script_content">Script Content (Optional)</Label>
                            <Textarea
                                id="script_content"
                                value={data.config.script_content || ''}
                                onChange={(e) => setData({
                                    ...data,
                                    config: { ...data.config, script_content: e.target.value }
                                })}
                                placeholder="Enter Python script content"
                                rows={10}
                            />
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

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
                            <h1 className="text-3xl font-bold tracking-tight">Create Filter</h1>
                            <p className="text-muted-foreground">
                                Add a new message routing filter
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {errors.general && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{errors.general}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Filter Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData({ ...data, name: e.target.value })}
                                            placeholder="Enter filter name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="type">Filter Type</Label>
                                        <Select value={data.type} onValueChange={(value) => setData({ ...data, type: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select filter type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filterTypes.map((filterType) => {
                                                    const IconComponent = filterType.icon;
                                                    return (
                                                        <SelectItem key={filterType.value} value={filterType.value}>
                                                            <div className="flex items-center gap-2">
                                                                <IconComponent className="h-4 w-4" />
                                                                <span>{filterType.label}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {getSelectedFilterType() && (
                                        <div className="p-4 bg-muted rounded-lg">
                                            <h4 className="font-medium mb-2">Filter Information</h4>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                {getSelectedFilterType()?.description}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Routes:</span> {getSelectedFilterType()?.routes}
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData({ ...data, description: e.target.value })}
                                            placeholder="Enter filter description"
                                            rows={3}
                                        />
                                    </div>

                                    {data.type && renderConfigFields()}

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData({ ...data, is_active: checked as boolean })}
                                        />
                                        <Label htmlFor="is_active">Active</Label>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Create Filter
                                            </>
                                        )}
                                    </Button>
                                    <Link to="/filters">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 