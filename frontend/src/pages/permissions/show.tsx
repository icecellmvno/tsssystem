import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

interface Permission {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface Props {
  permission: Permission
}

export default function PermissionsShow({ permission }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'User Management',
      href: '#',
    },
    {
      title: 'Permissions',
      href: '/permissions',
    },
    {
      title: permission.name,
      href: `/permissions/${permission.id}`,
    },
  ]

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Permission Details - ${permission.name}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/permissions">
              <Button variant="ghost" className="p-0">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Permissions
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Permission Details</h1>
              <p className="text-muted-foreground">View permission information</p>
            </div>
          </div>
          <Link href={`/permissions/${permission.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Permission
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permission Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Permission Name</label>
              <p className="text-sm text-gray-900 mt-1">{permission.name}</p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-gray-500">Created At</label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(permission.created_at).toLocaleString()}
              </p>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(permission.updated_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 