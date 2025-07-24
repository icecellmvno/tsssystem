import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
  roles: Role[]
}

interface Props {
  user: User
}

export default function UsersShow({ user }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'User Management',
      href: '#',
    },
    {
      title: 'Users',
      href: '/users',
    },
    {
      title: user.name,
      href: `/users/${user.id}`,
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`User Details - ${user.name}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/users">
              <Button variant="ghost" className="p-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
              <p className="text-muted-foreground">View user information and roles</p>
            </div>
          </div>
          <Link href={`/users/${user.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
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
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900 mt-1">{user.name}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900 mt-1">{user.email}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(user.created_at).toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(user.updated_at).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent>
              {user.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role.id} variant="secondary">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No roles assigned</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
} 