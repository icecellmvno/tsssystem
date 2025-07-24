import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

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
    title: 'Create Role',
    href: '/roles/create',
  },
]

interface Permission {
  id: number
  name: string
}

interface Props {
  permissions: Permission[]
}

export default function RolesCreate({ permissions }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    permission_ids: [] as number[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    router.post('/roles', formData, {
      onSuccess: () => {
        toast.success('Role created successfully')
      },
      onError: (errors) => {
        setErrors(errors)
        toast.error('Failed to create role')
      },
      onFinish: () => {
        setIsSubmitting(false)
      }
    })
  }

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: checked 
        ? [...prev.permission_ids, permissionId]
        : prev.permission_ids.filter(id => id !== permissionId)
    }))
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Role" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.get('/roles')}
            className="p-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
            <p className="text-muted-foreground">Add a new role to the system</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={formData.permission_ids.includes(permission.id)}
                        onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="text-sm font-normal">
                        {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.permission_ids && (
                  <p className="text-sm text-red-500">{errors.permission_ids}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.get('/roles')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 