import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Search, Edit, Trash2, Building2, Phone, User, Users } from 'lucide-react';
import { countrySitesService, type CountrySite } from '@/services/countrysites';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { useAuthStore } from '@/stores/auth-store';
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

export default function CountrySitesIndex() {
    const { user } = useAuthStore();
    const [countrySites, setCountrySites] = useState<CountrySite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        loadCountrySites();
    }, [searchTerm, sortBy, sortOrder, currentPage]);

    const loadCountrySites = async () => {
        try {
            setLoading(true);
            const response = await countrySitesService.getAll({
                search: searchTerm,
                sort_by: sortBy,
                sort_order: sortOrder,
                page: currentPage,
                per_page: 10,
            });
            console.log('Country sites response:', response);
            setCountrySites(response.data || []);
            setTotalPages(response.last_page || 1);
            setTotalRecords(response.total || 0);
        } catch (err) {
            console.error('Error fetching country sites:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch country sites');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await countrySitesService.delete(id);
            toast.success('Country site deleted successfully');
            // Reload the list
            const response = await countrySitesService.getAll({
                search: searchTerm,
                sort_by: sortBy,
                sort_order: sortOrder,
                page: currentPage,
                per_page: 10,
            });
            setCountrySites(response.data || []);
            setTotalPages(response.last_page || 1);
            setTotalRecords(response.total || 0);
        } catch (error) {
            toast.error('Failed to delete country site');
        }
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!user) {
        return <div>Please log in to view country sites.</div>;
    }

    if (error) {
        return <div>Error loading country sites: {error}</div>;
    }

    return (
        <AppLayout>
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
                            <h1 className="text-3xl font-bold tracking-tight">Country Sites</h1>
                            <p className="text-muted-foreground">
                                Total records: {countrySites?.length || 0}
                            </p>
                        </div>
                    </div>
                    <Link to="/country-sites/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Country Site
                        </Button>
                    </Link>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search country sites..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Country Sites List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-muted-foreground">Loading country sites...</div>
                            </div>
                        ) : countrySites.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold">No country sites found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Get started by creating a new country site.
                                    </p>
                                    <Link to="/country-sites/create">
                                        <Button className="mt-4">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Country Site
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-medium">ID</th>
                                            <th className="text-left p-2 font-medium">Name</th>
                                            <th className="text-left p-2 font-medium">Phone Code</th>
                                            <th className="text-left p-2 font-medium">Manager User</th>
                                            <th className="text-left p-2 font-medium">Operator User</th>
                                            <th className="text-left p-2 font-medium">Created At</th>
                                            <th className="text-left p-2 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {countrySites.map((countrySite) => (
                                            <tr key={countrySite.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2">
                                                    <Badge variant="secondary">{countrySite.id}</Badge>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {countrySite.name}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <Badge variant="outline">{countrySite.country_phone_code}</Badge>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        {countrySite.manager_user}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {countrySite.operator_user}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-sm text-muted-foreground">
                                                    {formatDate(countrySite.created_at)}
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Link to={`/country-sites/${countrySite.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="outline" size="sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Country Site</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{countrySite.name}"? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(countrySite.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 