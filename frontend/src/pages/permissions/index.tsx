import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Eye, Trash2, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { DataTable } from '@/components/ui/data-table';
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns';
import { permissionsService, type Permission } from '@/services/permissions';

interface PermissionWithBase extends Permission, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'User Management',
    href: '#',
  },
  {
    title: 'Permissions',
    href: '/permissions',
  },
];

export default function PermissionsIndex() {
  const { token } = useAuthStore();
  const [permissions, setPermissions] = useState<PermissionWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch permissions from API
  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await permissionsService.getPermissions();
      
      // Transform data to include BaseRecord properties
      const transformedData: PermissionWithBase[] = data.permissions.map(permission => ({
        ...permission,
        id: permission.id,
        created_at: permission.created_at,
        updated_at: permission.updated_at,
      }));
      
      setPermissions(transformedData);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const filteredPermissions = useMemo(() => {
    return permissions.filter(permission =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description && permission.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [permissions, searchTerm]);

  const handleDelete = useCallback(async (permission: PermissionWithBase) => {
    try {
      await permissionsService.deletePermission(permission.id);
      toast.success('Permission deleted successfully');
      fetchPermissions();
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission');
    }
  }, [fetchPermissions]);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => row.getValue('description') || 'No description',
    },
    {
      accessorKey: 'role_count',
      header: 'Roles',
      cell: ({ row }) => {
        const roleCount = row.getValue('role_count') as number;
        return (
          <Badge variant="secondary" className="text-xs">
            {roleCount || 0} roles
          </Badge>
        );
      },
    },
    createCreatedAtColumn<PermissionWithBase>(),
    createActionsColumn<PermissionWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/permissions/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this permission?",
    }),
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
            <p className="text-muted-foreground">Manage system permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPermissions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/permissions/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Permission
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredPermissions}
          title="Permissions"
          description={`Showing ${filteredPermissions.length} permissions`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 
