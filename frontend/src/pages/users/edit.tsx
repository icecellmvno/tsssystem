import { useState, useEffect } from 'react'
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

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  username: string
  email: string
  roles: Role[]
}

interface Props {
  user: User
  roles: Role[]
}

export default function UsersEdit({ user, roles }: Props) {
  const [formData, setFormData] = useState({
    name: user.name,
    username: user.username,
    email: user.email,
    password: '',
    password_confirmation: '',
    role_ids: user.roles.map(role => role.id)
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      href: `/users/${user.id}/edit`,
    },
  ]

  useEffect(() => {
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      password_confirmation: '',
      role_ids: user.roles.map(role => role.id)
    })
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const data = { ...formData }
    if (!data.password) {
      delete data.password
      delete data.password_confirmation
    }

    router.put(`/users/${user.id}`, data, {
      onSuccess: () => {
        toast.success('User updated successfully')
      },
      onError: (errors) => {
        setErrors(errors)
        toast.error('Failed to update user')
      },
      onFinish: () => {
        setIsSubmitting(false)
      }
    })
  }

  const handleRoleChange = (roleId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      role_ids: checked 
        ? [...prev.role_ids, roleId]
        : prev.role_ids.filter(id => id !== roleId)
    }))
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit User - ${user.name}`} />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.get('/users')}
            className="p-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit User</h1>
            <p className="text-muted-foreground">Update user information and roles</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password (leave blank to keep current)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirm Password</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                    className={errors.password_confirmation ? 'border-red-500' : ''}
                  />
                  {errors.password_confirmation && (
                    <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Roles</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={formData.role_ids.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm font-normal">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.role_ids && (
                  <p className="text-sm text-red-500">{errors.role_ids}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.get('/users')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
} 