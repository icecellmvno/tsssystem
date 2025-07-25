
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Shield, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

interface Permission {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  role_count?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'User Management', href: '#' },
  { title: 'Permissions', href: '/permissions' },
  { title: 'Details', href: '#' },
];

export default function PermissionsShow() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuthStore();
  const [permission, setPermission] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch permission from API
  const fetchPermission = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/permissions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermission(data.permission || data);
      } else {
        toast.error('Failed to fetch permission');
      }
    } catch (error) {
      console.error('Error fetching permission:', error);
      toast.error('Failed to fetch permission');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermission();
  }, [id]);

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading permission...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!permission) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Permission Not Found</h2>
              <p className="text-muted-foreground mb-4">The permission you're looking for doesn't exist.</p>
              <Link to="/permissions">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Permissions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/permissions">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Permissions
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Permission Details</h1>
              <p className="text-muted-foreground">
                Permission ID: {permission.id}
              </p>
            </div>
          </div>
          <Link to={`/permissions/${permission.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Permission
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Permission Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{permission.name}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{permission.description || 'No description'}</p>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(permission.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(permission.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usage Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Roles with this Permission</label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {permission.role_count !== undefined ? (
                    <Badge variant="secondary">{permission.role_count} roles</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">N/A</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 
