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
import { rolesService, type Role } from '@/services/roles';

interface RoleWithBase extends Role, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'User Management',
    href: '#',
  },
  {
    title: 'Roles',
    href: '/roles',
  },
];

export default function RolesIndex() {
  const { token } = useAuthStore();
  const [roles, setRoles] = useState<RoleWithBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rolesService.getRoles();
      
      // Transform data to include BaseRecord properties
      const transformedData: RoleWithBase[] = data.roles.map(role => ({
        ...role,
        id: role.id,
        created_at: role.created_at,
        updated_at: role.updated_at,
      }));
      
      setRoles(transformedData);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  const handleDelete = useCallback(async (role: RoleWithBase) => {
    try {
      await rolesService.deleteRole(role.id);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  }, [fetchRoles]);

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
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.getValue('permissions') as any[];
        return (
          <div className="flex flex-wrap gap-1">
            {permissions?.slice(0, 3).map((permission) => (
              <Badge key={permission.id} variant="outline" className="text-xs">
                {permission.name}
              </Badge>
            ))}
            {permissions?.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{permissions.length - 3} more
              </Badge>
            )}
            {(!permissions || permissions.length === 0) && (
              <span className="text-muted-foreground text-sm">No permissions</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'user_count',
      header: 'Users',
      cell: ({ row }) => {
        const userCount = row.getValue('user_count') as number;
        return (
          <Badge variant="secondary" className="text-xs">
            {userCount || 0} users
          </Badge>
        );
      },
    },
    createCreatedAtColumn<RoleWithBase>(),
    createActionsColumn<RoleWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/roles/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this role?",
    }),
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
            <p className="text-muted-foreground">Manage user roles and permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRoles}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/roles/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredRoles}
          title="Roles"
          description={`Showing ${filteredRoles.length} roles`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  );
} 
