import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { apiClient } from '@/services/api-client';

interface SmppUser {
  id: number;
  system_id: string;
  password: string;
  max_connection_speed: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SmppUsersEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [smppUser, setSmppUser] = useState<SmppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    system_id: '',
    password: '',
    max_connection_speed: '100',
    is_active: true,
  });

  // Fetch SMPP user data
  useEffect(() => {
    const fetchSmppUser = async () => {
      if (!id) return;
      
      try {
        const data = await apiClient.get<{ data: SmppUser }>(`/smpp-users/${id}`);
        setSmppUser(data.data);
        setFormData({
          system_id: data.data.system_id,
          password: data.data.password,
          max_connection_speed: data.data.max_connection_speed.toString(),
          is_active: data.data.is_active,
        });
      } catch (error) {
        console.error('Error fetching SMPP user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSmppUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    
    const data = {
      ...formData,
      max_connection_speed: parseInt(formData.max_connection_speed),
    };

    try {
      await apiClient.put(`/smpp-users/${id}`, data);
      navigate('/smpp-users');
    } catch (error) {
      console.error('Error updating SMPP user:', error);
      if (error instanceof Error) {
        setErrors({ general: error.message });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!smppUser) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">SMPP user not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SMPP Users',
        href: '/smpp-users',
    },
    {
        title: 'Edit SMPP User',
        href: `/smpp-users/${smppUser.id}/edit`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/smpp-users')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SMPP Users
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit SMPP User</h1>
              <p className="text-muted-foreground">Update SMPP user information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>SMPP User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="system_id">System ID *</Label>
                  <Input
                    id="system_id"
                    value={formData.system_id}
                    onChange={(e) => handleInputChange('system_id', e.target.value)}
                    placeholder="Enter system ID"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_connection_speed">Max Connection Speed (msg/sec) *</Label>
                  <Input
                    id="max_connection_speed"
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.max_connection_speed}
                    onChange={(e) => handleInputChange('max_connection_speed', e.target.value)}
                    placeholder="100"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Active (User can connect to SMPP server)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => navigate('/smpp-users')}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update SMPP User
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
} 