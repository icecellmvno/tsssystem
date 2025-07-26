import { useState } from 'react';
import { AppLayout } from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { type DeviceGroup } from '@/services/device-groups';

interface QRConfig {
  device_group: string;
      country_site: string;
  websocket_url: string;
  api_key: string;
  queue_name: string;
  battery_low_threshold: number;
  error_count_threshold: number;
  offline_threshold_minutes: number;
  signal_low_threshold: number;
  low_balance_threshold: string;
  enable_battery_alarms: boolean;
  enable_error_alarms: boolean;
  enable_offline_alarms: boolean;
  enable_signal_alarms: boolean;
  enable_sim_balance_alarms: boolean;
  auto_disable_sim_on_alarm: boolean;
  sim1_daily_sms_limit: number;
  sim1_monthly_sms_limit: number;
  sim2_daily_sms_limit: number;
  sim2_monthly_sms_limit: number;
  enable_sms_limits: boolean;
  sms_limit_reset_hour: number;
  sim1_guard_interval: number;
  sim2_guard_interval: number;
  timestamp: string;
}

export default function QRGenerator() {
  const { token } = useAuthStore();
  const [qrConfig, setQrConfig] = useState<QRConfig | null>(null);
  const [qrJson, setQrJson] = useState<string>('');
  const [deviceGroups] = useState<DeviceGroup[]>([]);
  const [selectedDeviceGroup, setSelectedDeviceGroup] = useState<string>('');
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    device_group: '',
            country_site: '',
    api_key: '',
    device_id: '',
    queue_name: 'device_queue',
    battery_low_threshold: 20,
    error_count_threshold: 5,
    offline_threshold_minutes: 5,
    signal_low_threshold: 2,
    low_balance_threshold: '10.00',
    enable_battery_alarms: true,
    enable_error_alarms: true,
    enable_offline_alarms: true,
    enable_signal_alarms: true,
    enable_sim_balance_alarms: true,
    auto_disable_sim_on_alarm: false,
    sim1_daily_sms_limit: 100,
    sim1_monthly_sms_limit: 1000,
    sim2_daily_sms_limit: 100,
    sim2_monthly_sms_limit: 1000,
    enable_sms_limits: false,
    sms_limit_reset_hour: 0,
    sim1_guard_interval: 1,
    sim2_guard_interval: 1,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateQR = async () => {
    if (!selectedDeviceGroup) {
      toast.error('Please select a device group');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/device-groups/${selectedDeviceGroup}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQrData(data.qr_data);
        toast.success('QR code generated successfully');
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadQR = () => {
    if (!qrJson) return;
    
    const blob = new Blob([qrJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
            a.download = `qr-config-${formData.device_group}-${formData.country_site}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('QR configuration downloaded');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">QR Code Generator</h1>
        <Badge variant="default">
          Device Configuration
        </Badge>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="result">QR Result</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="device_group">Device Group *</Label>
                  <Input
                    id="device_group"
                    value={formData.device_group}
                    onChange={(e) => handleInputChange('device_group', e.target.value)}
                    placeholder="Enter device group"
                  />
                </div>

                <div>
                                          <Label htmlFor="country_site">Country Site *</Label>
                        <Input
                            id="country_site"
                            value={formData.country_site}
                            onChange={(e) => handleInputChange('country_site', e.target.value)}
                            placeholder="Enter country site"
                        />
                </div>

                <div>
                  <Label htmlFor="api_key">API Key *</Label>
                  <Input
                    id="api_key"
                    value={formData.api_key}
                    onChange={(e) => handleInputChange('api_key', e.target.value)}
                    placeholder="Enter API key"
                  />
                </div>

                <div>
                  <Label htmlFor="queue_name">Queue Name</Label>
                  <Input
                    id="queue_name"
                    value={formData.queue_name}
                    onChange={(e) => handleInputChange('queue_name', e.target.value)}
                    placeholder="Enter queue name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Threshold Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="battery_low_threshold">Battery Low Threshold (%)</Label>
                  <Input
                    id="battery_low_threshold"
                    type="number"
                    value={formData.battery_low_threshold}
                    onChange={(e) => handleInputChange('battery_low_threshold', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="error_count_threshold">Error Count Threshold</Label>
                  <Input
                    id="error_count_threshold"
                    type="number"
                    value={formData.error_count_threshold}
                    onChange={(e) => handleInputChange('error_count_threshold', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="offline_threshold_minutes">Offline Threshold (minutes)</Label>
                  <Input
                    id="offline_threshold_minutes"
                    type="number"
                    value={formData.offline_threshold_minutes}
                    onChange={(e) => handleInputChange('offline_threshold_minutes', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="signal_low_threshold">Signal Low Threshold</Label>
                  <Input
                    id="signal_low_threshold"
                    type="number"
                    value={formData.signal_low_threshold}
                    onChange={(e) => handleInputChange('signal_low_threshold', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="low_balance_threshold">Low Balance Threshold</Label>
                  <Input
                    id="low_balance_threshold"
                    value={formData.low_balance_threshold}
                    onChange={(e) => handleInputChange('low_balance_threshold', e.target.value)}
                    placeholder="10.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alarm Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_battery_alarms"
                    checked={formData.enable_battery_alarms}
                    onCheckedChange={(checked) => handleInputChange('enable_battery_alarms', checked)}
                  />
                  <Label htmlFor="enable_battery_alarms">Enable Battery Alarms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_error_alarms"
                    checked={formData.enable_error_alarms}
                    onCheckedChange={(checked) => handleInputChange('enable_error_alarms', checked)}
                  />
                  <Label htmlFor="enable_error_alarms">Enable Error Alarms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_offline_alarms"
                    checked={formData.enable_offline_alarms}
                    onCheckedChange={(checked) => handleInputChange('enable_offline_alarms', checked)}
                  />
                  <Label htmlFor="enable_offline_alarms">Enable Offline Alarms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_signal_alarms"
                    checked={formData.enable_signal_alarms}
                    onCheckedChange={(checked) => handleInputChange('enable_signal_alarms', checked)}
                  />
                  <Label htmlFor="enable_signal_alarms">Enable Signal Alarms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_sim_balance_alarms"
                    checked={formData.enable_sim_balance_alarms}
                    onCheckedChange={(checked) => handleInputChange('enable_sim_balance_alarms', checked)}
                  />
                  <Label htmlFor="enable_sim_balance_alarms">Enable SIM Balance Alarms</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_disable_sim_on_alarm"
                    checked={formData.auto_disable_sim_on_alarm}
                    onCheckedChange={(checked) => handleInputChange('auto_disable_sim_on_alarm', checked)}
                  />
                  <Label htmlFor="auto_disable_sim_on_alarm">Auto Disable SIM on Alarm</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="enable_sms_limits"
                  checked={formData.enable_sms_limits}
                  onCheckedChange={(checked) => handleInputChange('enable_sms_limits', checked)}
                />
                <Label htmlFor="enable_sms_limits">Enable SMS Limits</Label>
              </div>

              {formData.enable_sms_limits && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="sim1_daily_sms_limit">SIM1 Daily Limit</Label>
                    <Input
                      id="sim1_daily_sms_limit"
                      type="number"
                      value={formData.sim1_daily_sms_limit}
                      onChange={(e) => handleInputChange('sim1_daily_sms_limit', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sim1_monthly_sms_limit">SIM1 Monthly Limit</Label>
                    <Input
                      id="sim1_monthly_sms_limit"
                      type="number"
                      value={formData.sim1_monthly_sms_limit}
                      onChange={(e) => handleInputChange('sim1_monthly_sms_limit', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sim2_daily_sms_limit">SIM2 Daily Limit</Label>
                    <Input
                      id="sim2_daily_sms_limit"
                      type="number"
                      value={formData.sim2_daily_sms_limit}
                      onChange={(e) => handleInputChange('sim2_daily_sms_limit', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sim2_monthly_sms_limit">SIM2 Monthly Limit</Label>
                    <Input
                      id="sim2_monthly_sms_limit"
                      type="number"
                      value={formData.sim2_monthly_sms_limit}
                      onChange={(e) => handleInputChange('sim2_monthly_sms_limit', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sms_limit_reset_hour">Reset Hour (0-23)</Label>
                    <Input
                      id="sms_limit_reset_hour"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.sms_limit_reset_hour}
                      onChange={(e) => handleInputChange('sms_limit_reset_hour', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sim1_guard_interval">SIM1 Guard Interval (seconds)</Label>
                    <Input
                      id="sim1_guard_interval"
                      type="number"
                      value={formData.sim1_guard_interval}
                      onChange={(e) => handleInputChange('sim1_guard_interval', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sim2_guard_interval">SIM2 Guard Interval (seconds)</Label>
                    <Input
                      id="sim2_guard_interval"
                      type="number"
                      value={formData.sim2_guard_interval}
                      onChange={(e) => handleInputChange('sim2_guard_interval', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={generateQR} disabled={loading} size="lg">
              {loading ? 'Generating...' : 'Generate QR Configuration'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="result" className="space-y-6">
          {qrConfig ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>QR Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Configuration Details</h3>
                      <div className="space-x-2">
                        <Button variant="outline" onClick={() => copyToClipboard(qrJson)}>
                          Copy JSON
                        </Button>
                        <Button variant="outline" onClick={downloadQR}>
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Device Group:</strong> {qrConfig.device_group}
                      </div>
                      <div>
                        <strong>Country Site:</strong> {qrConfig.country_site}
                      </div>
                      <div>
                        <strong>WebSocket URL:</strong> {qrConfig.websocket_url}
                      </div>
                      <div>
                        <strong>API Key:</strong> {qrConfig.api_key}
                      </div>
                      <div>
                        <strong>Queue Name:</strong> {qrConfig.queue_name}
                      </div>
                      <div>
                        <strong>Generated:</strong> {qrConfig.timestamp}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>QR JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={qrJson}
                    readOnly
                    className="min-h-[200px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Generate a QR configuration to see the result</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 