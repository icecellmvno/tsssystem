import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Building2, User, Users, Phone } from 'lucide-react';
import { countrySitesService, type User as CountrySiteUser, type CountrySite } from '@/services/countrysites';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';

export default function CountrySiteEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [users, setUsers] = useState<CountrySiteUser[]>([]);
    const [countrySite, setCountrySite] = useState<CountrySite | null>(null);
    const [loading, setLoading] = useState(false);
    const [usersLoading, setUsersLoading] = useState(true);
    const [countrySiteLoading, setCountrySiteLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        name: '',
        country_phone_code: '',
        manager_user: 0,
        operator_user: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                const [countrySiteData, usersData] = await Promise.all([
                    countrySitesService.getById(parseInt(id!)),
                    countrySitesService.getUsers()
                ]);
                
                setCountrySite(countrySiteData);
                setFormData({
                    name: countrySiteData.name,
                    country_phone_code: countrySiteData.country_phone_code,
                    manager_user: countrySiteData.manager_user,
                    operator_user: countrySiteData.operator_user,
                });
                
                if (Array.isArray(usersData)) {
                    setUsers(usersData);
                } else {
                    console.error('Users response is not an array:', usersData);
                    setUsers([]);
                    toast.error('Invalid users data received');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load country site data');
                navigate('/country-sites');
            } finally {
                setCountrySiteLoading(false);
                setUsersLoading(false);
            }
        };

        if (id) {
            loadData();
        }
    }, [id, navigate]);

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

            if (!formData.country_phone_code.trim()) {
                setErrors(prev => ({ ...prev, country_phone_code: 'Country phone code is required' }));
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
            
            await countrySitesService.update(parseInt(id!), formData);
            toast.success('Country site updated successfully');
            navigate('/country-sites');
        } catch (error: any) {
            if (error.errors) {
                setErrors(error.errors);
            } else {
                toast.error('Failed to update country site');
            }
        } finally {
            setLoading(false);
        }
    };

    if (countrySiteLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading country site...</div>
                </div>
            </AppLayout>
        );
    }

    if (!countrySite) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Country site not found</div>
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
                    onClick={() => navigate('/country-sites')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Country Site</h1>
                    <p className="text-muted-foreground">
                        Update country site information
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Country Site Information
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
                                    placeholder="e.g., Turkey"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Country Phone Code */}
                            <div className="space-y-2">
                                <Label htmlFor="country_phone_code">Country Phone Code *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="country_phone_code"
                                        value={formData.country_phone_code}
                                        onChange={(e) => handleChange('country_phone_code', e.target.value)}
                                        placeholder="e.g., +90"
                                        className="pl-10"
                                    />
                                </div>
                                {errors.country_phone_code && (
                                    <p className="text-sm text-destructive">{errors.country_phone_code}</p>
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
                                        {usersLoading ? (
                                            <SelectItem value="loading" disabled>
                                                Loading users...
                                            </SelectItem>
                                        ) : Array.isArray(users) && users.length > 0 ? (
                                            users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.username} ({user.email})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-users" disabled>
                                                No users available
                                            </SelectItem>
                                        )}
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
                                        {usersLoading ? (
                                            <SelectItem value="loading" disabled>
                                                Loading users...
                                            </SelectItem>
                                        ) : Array.isArray(users) && users.length > 0 ? (
                                            users.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.username} ({user.email})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-users" disabled>
                                                No users available
                                            </SelectItem>
                                        )}
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
                                {loading ? 'Updating...' : 'Update Country Site'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/country-sites')}
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