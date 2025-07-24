import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { apiClient } from '@/services/api-client';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'SMPP Users',
        href: '/smpp-users',
    },
    {
        title: 'Create SMPP User',
        href: '/smpp-users/create',
    },
];

export default function SmppUsersCreate() {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    system_id: '',
    password: '',
    max_connection_speed: '100',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});
    
    const data = {
      ...formData,
      max_connection_speed: parseInt(formData.max_connection_speed),
    };

    try {
      await apiClient.post('/smpp-users', data);
      navigate('/smpp-users');
    } catch (error) {
      console.error('Error creating SMPP user:', error);
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
              <h1 className="text-3xl font-bold tracking-tight">Create SMPP User</h1>
              <p className="text-muted-foreground">Add a new SMPP user to the system</p>
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create SMPP User
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