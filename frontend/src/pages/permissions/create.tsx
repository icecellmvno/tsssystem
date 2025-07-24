import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  {
    title: 'Create Permission',
    href: '/permissions/create',
  },
]

export default function PermissionsCreate() {
  const [formData, setFormData] = useState({
    name: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    router.post('/permissions', formData, {
      onSuccess: () => {
        toast.success('Permission created successfully')
      },
      onError: (errors) => {
        setErrors(errors)
        toast.error('Failed to create permission')
      },
      onFinish: () => {
        setIsSubmitting(false)
      }
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Permission" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.get('/permissions')}
            className="p-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Permissions
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Permission</h1>
            <p className="text-muted-foreground">Add a new permission to the system</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Permission Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Permission Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="e.g., users.create, roles.edit"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.get('/permissions')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Creating...' : 'Create Permission'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 