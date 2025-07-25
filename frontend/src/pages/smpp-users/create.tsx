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
import type { SmppUserCreateRequest } from '@/types';

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

  
  const [formData, setFormData] = useState<SmppUserCreateRequest>({
    system_id: '',
    password: '',
    max_connection_speed: 100,
    is_active: true,
    
    // MT Messaging Credentials - Defaults
    mt_src_addr: '',
    mt_http_throughput: 'ND',
    mt_balance: 'ND',
    mt_smpps_throughput: 'ND',
    mt_sms_count: 'ND',
    mt_early_percent: 'ND',
    mt_priority_filter: '^[0-3]$',
    mt_content_filter: '.*',
    mt_src_addr_filter: '.*',
    mt_dst_addr_filter: '.*',
    mt_validity_period_filter: '^\\d+$',
    mt_http_send: true,
    mt_http_dlr_method: true,
    mt_http_balance: true,
    mt_smpps_send: true,
    mt_priority: true,
    mt_http_long_content: true,
    mt_src_addr_auth: true,
    mt_dlr_level: true,
    mt_http_rate: true,
    mt_validity_period: true,
    mt_http_bulk: false,
    mt_hex_content: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await apiClient.post('/smpp-users', formData);
      navigate('/smpp-users');
    } catch (error) {
      console.error('Error creating SMPP user:', error);
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
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
                      onChange={(e) => handleInputChange('max_connection_speed', parseInt(e.target.value))}
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

              {/* MT Messaging Credentials - Quota */}
              <Card>
                <CardHeader>
                  <CardTitle>MT Messaging Credentials - Quota</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mt_src_addr">Source Address</Label>
                    <Input
                      id="mt_src_addr"
                      value={formData.mt_src_addr || ''}
                      onChange={(e) => handleInputChange('mt_src_addr', e.target.value)}
                      placeholder="None"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_http_throughput">HTTP Throughput</Label>
                    <Input
                      id="mt_http_throughput"
                      value={formData.mt_http_throughput || ''}
                      onChange={(e) => handleInputChange('mt_http_throughput', e.target.value)}
                      placeholder="ND"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_balance">Balance</Label>
                    <Input
                      id="mt_balance"
                      value={formData.mt_balance || ''}
                      onChange={(e) => handleInputChange('mt_balance', e.target.value)}
                      placeholder="ND"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_smpps_throughput">SMPPS Throughput</Label>
                    <Input
                      id="mt_smpps_throughput"
                      value={formData.mt_smpps_throughput || ''}
                      onChange={(e) => handleInputChange('mt_smpps_throughput', e.target.value)}
                      placeholder="ND"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_sms_count">SMS Count</Label>
                    <Input
                      id="mt_sms_count"
                      value={formData.mt_sms_count || ''}
                      onChange={(e) => handleInputChange('mt_sms_count', e.target.value)}
                      placeholder="ND"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_early_percent">Early Percent</Label>
                    <Input
                      id="mt_early_percent"
                      value={formData.mt_early_percent || ''}
                      onChange={(e) => handleInputChange('mt_early_percent', e.target.value)}
                      placeholder="ND"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* MT Messaging Credentials - Value Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>MT Messaging Credentials - Value Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="mt_priority_filter">Priority Filter</Label>
                    <Input
                      id="mt_priority_filter"
                      value={formData.mt_priority_filter || ''}
                      onChange={(e) => handleInputChange('mt_priority_filter', e.target.value)}
                      placeholder="^[0-3]$"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_content_filter">Content Filter</Label>
                    <Input
                      id="mt_content_filter"
                      value={formData.mt_content_filter || ''}
                      onChange={(e) => handleInputChange('mt_content_filter', e.target.value)}
                      placeholder=".*"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_src_addr_filter">Source Address Filter</Label>
                    <Input
                      id="mt_src_addr_filter"
                      value={formData.mt_src_addr_filter || ''}
                      onChange={(e) => handleInputChange('mt_src_addr_filter', e.target.value)}
                      placeholder=".*"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_dst_addr_filter">Destination Address Filter</Label>
                    <Input
                      id="mt_dst_addr_filter"
                      value={formData.mt_dst_addr_filter || ''}
                      onChange={(e) => handleInputChange('mt_dst_addr_filter', e.target.value)}
                      placeholder=".*"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mt_validity_period_filter">Validity Period Filter</Label>
                    <Input
                      id="mt_validity_period_filter"
                      value={formData.mt_validity_period_filter || ''}
                      onChange={(e) => handleInputChange('mt_validity_period_filter', e.target.value)}
                      placeholder="^\\d+$"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* MT Messaging Credentials - Authorization */}
              <Card>
                <CardHeader>
                  <CardTitle>MT Messaging Credentials - Authorization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_http_send"
                        checked={formData.mt_http_send}
                        onCheckedChange={(checked) => handleInputChange('mt_http_send', checked)}
                      />
                      <Label htmlFor="mt_http_send" className="text-sm font-normal">HTTP Send</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_http_dlr_method"
                        checked={formData.mt_http_dlr_method}
                        onCheckedChange={(checked) => handleInputChange('mt_http_dlr_method', checked)}
                      />
                      <Label htmlFor="mt_http_dlr_method" className="text-sm font-normal">HTTP DLR Method</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_http_balance"
                        checked={formData.mt_http_balance}
                        onCheckedChange={(checked) => handleInputChange('mt_http_balance', checked)}
                      />
                      <Label htmlFor="mt_http_balance" className="text-sm font-normal">HTTP Balance</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_smpps_send"
                        checked={formData.mt_smpps_send}
                        onCheckedChange={(checked) => handleInputChange('mt_smpps_send', checked)}
                      />
                      <Label htmlFor="mt_smpps_send" className="text-sm font-normal">SMPPS Send</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_priority"
                        checked={formData.mt_priority}
                        onCheckedChange={(checked) => handleInputChange('mt_priority', checked)}
                      />
                      <Label htmlFor="mt_priority" className="text-sm font-normal">Priority</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_http_long_content"
                        checked={formData.mt_http_long_content}
                        onCheckedChange={(checked) => handleInputChange('mt_http_long_content', checked)}
                      />
                      <Label htmlFor="mt_http_long_content" className="text-sm font-normal">HTTP Long Content</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_src_addr_auth"
                        checked={formData.mt_src_addr_auth}
                        onCheckedChange={(checked) => handleInputChange('mt_src_addr_auth', checked)}
                      />
                      <Label htmlFor="mt_src_addr_auth" className="text-sm font-normal">Source Address Auth</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_dlr_level"
                        checked={formData.mt_dlr_level}
                        onCheckedChange={(checked) => handleInputChange('mt_dlr_level', checked)}
                      />
                      <Label htmlFor="mt_dlr_level" className="text-sm font-normal">DLR Level</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_http_rate"
                        checked={formData.mt_http_rate}
                        onCheckedChange={(checked) => handleInputChange('mt_http_rate', checked)}
                      />
                      <Label htmlFor="mt_http_rate" className="text-sm font-normal">HTTP Rate</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_validity_period"
                        checked={formData.mt_validity_period}
                        onCheckedChange={(checked) => handleInputChange('mt_validity_period', checked)}
                      />
                      <Label htmlFor="mt_validity_period" className="text-sm font-normal">Validity Period</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_http_bulk"
                        checked={formData.mt_http_bulk}
                        onCheckedChange={(checked) => handleInputChange('mt_http_bulk', checked)}
                      />
                      <Label htmlFor="mt_http_bulk" className="text-sm font-normal">HTTP Bulk</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mt_hex_content"
                        checked={formData.mt_hex_content}
                        onCheckedChange={(checked) => handleInputChange('mt_hex_content', checked)}
                      />
                      <Label htmlFor="mt_hex_content" className="text-sm font-normal">Hex Content</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

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