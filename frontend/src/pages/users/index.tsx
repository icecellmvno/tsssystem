import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Edit, Eye, Trash2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { AppLayout } from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { useAuthStore } from '@/stores/auth-store'
import { DataTable } from '@/components/ui/data-table'
import {
    createIdColumn, 
    createCreatedAtColumn, 
    createActionsColumn,
    type BaseRecord 
} from '@/components/ui/data-table-columns'
import { usersService, type User } from '@/services/users'

interface UserWithBase extends User, BaseRecord {}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'User Management',
    href: '#',
  },
  {
    title: 'Users',
    href: '/users',
  },
]

export default function UsersIndex() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<UserWithBase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      
      // Transform data to include BaseRecord properties
      const transformedData: UserWithBase[] = data.users.map(user => ({
        ...user,
        id: user.id,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
      
      setUsers(transformedData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.firstname && user.firstname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastname && user.lastname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [users, searchTerm]);

  const handleDelete = useCallback(async (user: UserWithBase) => {
    try {
      await usersService.deleteUser(user.id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  }, [fetchUsers]);

  // TanStack Table columns
  const columns = useMemo(() => [
    {
      accessorKey: 'firstname',
      header: 'First Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('firstname')}</div>
      ),
    },
    {
      accessorKey: 'lastname',
      header: 'Last Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('lastname')}</div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => row.getValue('username'),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.getValue('email'),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge variant="outline" className="text-xs">
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    createCreatedAtColumn<UserWithBase>(),
    createActionsColumn<UserWithBase>({
      onDelete: handleDelete,
      editPath: (record) => `/users/${record.id}/edit`,
      deleteConfirmMessage: "Are you sure you want to delete this user?",
    }),
  ], [handleDelete]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage system users and their permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Link to="/users/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          title="Users"
          description={`Showing ${filteredUsers.length} users`}
          showSearch={false}
          showViewOptions={false}
          showPagination={true}
          pageSize={10}
        />
      </div>
    </AppLayout>
  )
} 