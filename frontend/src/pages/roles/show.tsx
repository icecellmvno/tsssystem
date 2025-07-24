import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

interface Permission {
  id: number
  name: string
}

interface Role {
  id: number
  name: string
  created_at: string
  updated_at: string
  permissions: Permission[]
}

interface Props {
  role: Role
}

export default function RolesShow({ role }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'User Management',
      href: '#',
    },
    {
      title: 'Roles',
      href: '/roles',
    },
    {
      title: role.name,
      href: `/roles/${role.id}`,
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Role Details - ${role.name}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/roles">
              <Button variant="ghost" className="p-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roles
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Role Details</h1>
              <p className="text-muted-foreground">View role information and permissions</p>
            </div>
          </div>
          <Link href={`/roles/${role.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Role
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Role Name</label>
                <p className="text-sm text-gray-900 mt-1">{role.name}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(role.created_at).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(role.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <Badge key={permission.id} variant="secondary">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No permissions assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 