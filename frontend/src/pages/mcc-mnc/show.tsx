
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Calendar, Hash, Plus, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'MCC-MNC List',
        href: '/mcc-mnc',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface OperatorCommand {
    id: number;
    name: string;
    command_type: string;
    key: string;
    code: string;
    message_text: string;
    number: string;
    created_at: string;
    updated_at: string;
}

interface MccMncItem {
    id: number;
    type: string;
    country_name: string;
    country_code: string;
    mcc: string;
    mnc: string;
    brand: string;
    operator: string;
    status: string;
    bands: string;
    notes: string;
    created_at: string;
    updated_at: string;
    operator_commands: OperatorCommand[];
}

interface Props {
    mccMnc: MccMncItem;
}

export default function MccMncShow({ mccMnc }: Props) {
    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'operational':
                return 'default';
            case 'not operational':
                return 'destructive';
            case 'unknown':
                return 'secondary';
            case 'reserved':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    const getTypeBadgeVariant = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'national':
                return 'default';
            case 'international':
                return 'outline';
            default:
                return 'secondary';
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                MCC-MNC: {mccMnc.mcc}-{mccMnc.mnc}
                            </h1>
                            <p className="text-muted-foreground">
                                Detailed information about this MCC-MNC record
                            </p>
                        </div>
                    </div>
                    <Link to={`/mcc-mnc/${mccMnc.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Hash className="h-4 w-4" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">MCC</label>
                                    <p className="font-mono text-lg">{mccMnc.mcc}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">MNC</label>
                                    <p className="font-mono text-lg">{mccMnc.mnc}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Full Code</label>
                                <p className="font-mono text-lg font-bold">{mccMnc.mcc}-{mccMnc.mnc}</p>
                            </div>

                            <div className="flex gap-2">
                                {mccMnc.type && (
                                    <Badge variant={getTypeBadgeVariant(mccMnc.type)}>
                                        {mccMnc.type}
                                    </Badge>
                                )}
                                {mccMnc.status && (
                                    <Badge variant={getStatusBadgeVariant(mccMnc.status)}>
                                        {mccMnc.status}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Country Name</label>
                                <p className="text-lg">{mccMnc.country_name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Country Code</label>
                                <p className="font-mono text-lg">{mccMnc.country_code || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operator Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Operator Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Brand</label>
                                <p className="text-lg">{mccMnc.brand || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Operator</label>
                                <p className="text-lg">{mccMnc.operator || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Technical Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Bands</label>
                                <p className="text-sm whitespace-pre-wrap">{mccMnc.bands || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                <p className="text-sm whitespace-pre-wrap">{mccMnc.notes || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Timestamps */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Timestamps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                    <p className="text-sm">{formatDate(mccMnc.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                    <p className="text-sm">{formatDate(mccMnc.updated_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Operator Commands */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Operator Commands
                            </CardTitle>
                            <Link to={`/operator-commands/create?mcc_mnc_id=${mccMnc.id}`}>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Command
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {mccMnc.operator_commands && mccMnc.operator_commands.length > 0 ? (
                            <div className="space-y-4">
                                {mccMnc.operator_commands.map((command) => (
                                    <div key={command.id} className="border rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{command.name}</h4>
                                                <Badge variant={command.command_type === 'sms' ? 'default' : 'outline'}>
                                                    {command.command_type.toUpperCase()}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {command.key.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link to={`/operator-commands/${command.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium">Code:</span>
                                                <span className="font-mono ml-2">{command.code}</span>
                                            </div>
                                            {command.command_type === 'sms' && (
                                                <>
                                                    {command.message_text && (
                                                        <div>
                                                            <span className="font-medium">Message:</span>
                                                            <span className="ml-2">{command.message_text}</span>
                                                        </div>
                                                    )}
                                                    {command.number && (
                                                        <div>
                                                            <span className="font-medium">Number:</span>
                                                            <span className="ml-2">{command.number}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>No operator commands found.</p>
                                <Link to={`/operator-commands/create?mcc_mnc_id=${mccMnc.id}`}>
                                    <Button variant="outline" className="mt-2">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add First Command
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 
