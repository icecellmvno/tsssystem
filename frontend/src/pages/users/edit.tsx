import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usersService, type User, type UserUpdateRequest } from '@/services/users';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'User Management', href: '#' },
  { title: 'Users', href: '/users' },
  { title: 'Edit User', href: '#' },
];

const availableRoles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'operator', label: 'Operator' },
  { value: 'user', label: 'User' },
];

export default function UsersEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<UserUpdateRequest>({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    role: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user from API
  const fetchUser = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await usersService.getUserById(parseInt(id));
      const userInfo = response.user;
      
      setUser(userInfo);
      setFormData({
        username: userInfo.username || '',
        firstname: userInfo.firstname || '',
        lastname: userInfo.lastname || '',
        email: userInfo.email || '',
        role: userInfo.role || '',
        is_active: userInfo.is_active
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setSaving(true);
    setErrors({});

    try {
      // Create update data with only changed fields
      const updateData: UserUpdateRequest = {};
      
      // Only include fields that have been changed
      if (formData.username !== user?.username) {
        updateData.username = formData.username;
      }
      if (formData.firstname !== user?.firstname) {
        updateData.firstname = formData.firstname;
      }
      if (formData.lastname !== user?.lastname) {
        updateData.lastname = formData.lastname;
      }
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      if (formData.role !== user?.role) {
        updateData.role = formData.role;
      }
      if (formData.is_active !== user?.is_active) {
        updateData.is_active = formData.is_active;
      }
      
      // Only include password if it's not empty, meets minimum length, and has been changed
      if (formData.password && formData.password.trim() !== '' && formData.password.trim().length >= 6) {
        updateData.password = formData.password;
      }
      // If password field is empty or too short, don't include it in the update at all
      // This prevents sending empty string which would be hashed as empty password
      
      await usersService.updateUser(parseInt(id), updateData);
      toast.success('User updated successfully');
      navigate('/users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.errors) {
        setErrors(error.errors);
      }
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserUpdateRequest, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading user...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
              <Button variant="outline" onClick={() => navigate('/users')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Users
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/users')}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange('firstname', e.target.value)}
                    placeholder="First name"
                    required
                  />
                  {errors.firstname && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstname}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    placeholder="Last name"
                    required
                  />
                  {errors.lastname && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastname}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Username"
                    required
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500 mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Email address"
                    required
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password (leave blank to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="New password (optional, min 6 characters)"
                />
                {formData.password && formData.password.trim() !== '' && formData.password.trim().length < 6 && (
                  <p className="text-sm text-red-500 mt-1">Password must be at least 6 characters long</p>
                )}
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked as boolean)}
                />
                <Label htmlFor="is_active">Active User</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => handleInputChange('role', value)} value={formData.role}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">{errors.role}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button 
              type="submit" 
              disabled={saving || (formData.password && formData.password.trim() !== '' && formData.password.trim().length < 6)}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/users')}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
} 
