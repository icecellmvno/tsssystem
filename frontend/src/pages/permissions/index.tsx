import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import { Plus, Search, Edit, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'User Management',
    href: '#',
  },
  {
    title: 'Permissions',
    href: '/permissions',
  },
]

interface Permission {
  id: number
  name: string
  created_at: string
}

interface Props {
  permissions: Permission[]
}

export default function PermissionsIndex({ permissions }: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (permissionId: number) => {
    router.delete(`/permissions/${permissionId}`, {
      onSuccess: () => {
        toast.success('Permission deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete permission')
      }
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permissions" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
            <p className="text-muted-foreground">Manage system permissions</p>
          </div>
          <Link href="/permissions/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Permission
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="font-medium">{permission.name}</TableCell>
                  <TableCell>
                    {new Date(permission.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/permissions/${permission.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/permissions/${permission.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{permission.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(permission.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  )
} 