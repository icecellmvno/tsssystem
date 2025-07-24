import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Building2, User, Users } from 'lucide-react';
import { sitenamesService, type User as SitenameUser, type Sitename } from '@/services/sitenames';
import { toast } from 'sonner';

export default function SitenameEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [users, setUsers] = useState<SitenameUser[]>([]);
    const [sitename, setSitename] = useState<Sitename | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: '',
        manager_user: 0,
        operator_user: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setInitialLoading(true);
            const [sitenameResponse, usersResponse] = await Promise.all([
                sitenamesService.getById(parseInt(id!)),
                sitenamesService.getUsers()
            ]);
            
            setSitename(sitenameResponse);
            setUsers(usersResponse);
            
            // Load existing data into form
            setFormData({
                name: sitenameResponse.name,
                manager_user: sitenameResponse.manager_user,
                operator_user: sitenameResponse.operator_user,
            });
        } catch (error) {
            toast.error('Failed to load data');
            navigate('/sitenames');
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            if (!formData.name.trim()) {
                setErrors(prev => ({ ...prev, name: 'Name is required' }));
                return;
            }

            if (formData.manager_user === 0) {
                setErrors(prev => ({ ...prev, manager_user: 'Manager user is required' }));
                return;
            }

            if (formData.operator_user === 0) {
                setErrors(prev => ({ ...prev, operator_user: 'Operator user is required' }));
                return;
            }
            
            await sitenamesService.update(parseInt(id!), formData);
            toast.success('Sitename updated successfully');
            navigate('/sitenames');
        } catch (error: any) {
            if (error.errors) {
                setErrors(error.errors);
            } else {
                toast.error('Failed to update sitename');
            }
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
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

    if (!sitename) {
        return (
            <AppLayout>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground">Sitename not found</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/sitenames')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Sitename</h1>
                        <p className="text-muted-foreground">
                            Update sitename information and assigned users
                        </p>
                    </div>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Sitename Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="e.g., Site A"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                {/* Manager User */}
                                <div className="space-y-2">
                                    <Label htmlFor="manager_user">Manager User *</Label>
                                    <Select value={formData.manager_user.toString()} onValueChange={(value) => handleChange('manager_user', parseInt(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select manager user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.manager_user && (
                                        <p className="text-sm text-destructive">{errors.manager_user}</p>
                                    )}
                                </div>

                                {/* Operator User */}
                                <div className="space-y-2">
                                    <Label htmlFor="operator_user">Operator User *</Label>
                                    <Select value={formData.operator_user.toString()} onValueChange={(value) => handleChange('operator_user', parseInt(value))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select operator user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.operator_user && (
                                        <p className="text-sm text-destructive">{errors.operator_user}</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4">
                                <Button type="submit" disabled={loading}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {loading ? 'Updating...' : 'Update Sitename'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/sitenames')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 