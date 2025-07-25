import React, { useEffect, useState } from 'react';
import { useWebSocketStore } from '@/stores/websocket-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WebSocketTest() {
  const [apiKey, setApiKey] = useState('test-api-key');
  const [isHandicap, setIsHandicap] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [ussdCode, setUssdCode] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');

  const {
    isConnected,
    isConnecting,
    error,
    devices,
    notifications,
    connect,
    disconnect,
    getAllDevices,
    SendSms,
    SendUssd,
    FindDevice,
    StartAlarm,
    StopAlarm,
  } = useWebSocketStore();

  const connectedDevices = getAllDevices();

  const handleConnect = async () => {
    try {
      await connect(apiKey, isHandicap);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSendSms = async () => {
    if (!selectedDevice || !phoneNumber || !message) {
      alert('Please fill all fields');
      return;
    }

    try {
      await SendSms(selectedDevice, {
        sim_slot: 0,
        phone_number: phoneNumber,
        message: message,
        priority: 'normal'
      });
      alert('SMS sent successfully');
    } catch (error) {
      console.error('Failed to send SMS:', error);
      alert('Failed to send SMS');
    }
  };

  const handleSendUssd = async () => {
    if (!selectedDevice || !ussdCode) {
      alert('Please fill all fields');
      return;
    }

    try {
      await SendUssd(selectedDevice, {
        sim_slot: 0,
        ussd_code: ussdCode,
        delay: 0
      });
      alert('USSD sent successfully');
    } catch (error) {
      console.error('Failed to send USSD:', error);
      alert('Failed to send USSD');
    }
  };

  const handleFindDevice = async () => {
    if (!selectedDevice) {
      alert('Please select a device');
      return;
    }

    try {
      await FindDevice(selectedDevice, {
        message: 'Find my device'
      });
      alert('Find device command sent successfully');
    } catch (error) {
      console.error('Failed to find device:', error);
      alert('Failed to find device');
    }
  };

  const handleStartAlarm = async () => {
    if (!selectedDevice) {
      alert('Please select a device');
      return;
    }

    try {
      await StartAlarm(selectedDevice, {
        alarm_type: 'sim_blocked',
        message: 'SIM card is blocked'
      });
      alert('Alarm started successfully');
    } catch (error) {
      console.error('Failed to start alarm:', error);
      alert('Failed to start alarm');
    }
  };

  const handleStopAlarm = async () => {
    if (!selectedDevice) {
      alert('Please select a device');
      return;
    }

    try {
      await StopAlarm(selectedDevice);
      alert('Alarm stopped successfully');
    } catch (error) {
      console.error('Failed to stop alarm:', error);
      alert('Failed to stop alarm');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">WebSocket Test</h1>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {isConnecting && <Badge variant="secondary">Connecting...</Badge>}
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter API key"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isHandicap"
                checked={isHandicap}
                onChange={(e) => setIsHandicap(e.target.checked)}
              />
              <Label htmlFor="isHandicap">Handicap Device</Label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleConnect} disabled={isConnecting}>
                Connect
              </Button>
              <Button onClick={handleDisconnect} variant="outline" disabled={!isConnected}>
                Disconnect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices ({connectedDevices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {connectedDevices.length === 0 ? (
            <p className="text-muted-foreground">No devices connected</p>
          ) : (
            <div className="space-y-2">
              {connectedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{device.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.device_group} - {device.country_site}
                    </p>
                  </div>
                  <Badge variant={device.status === 'online' ? "default" : "secondary"}>
                    {device.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Commands */}
      <Card>
        <CardHeader>
          <CardTitle>Device Commands</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deviceSelect">Select Device</Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger>
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                {connectedDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.id} ({device.device_group})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SMS Command */}
          <div className="space-y-2">
            <h3 className="font-medium">Send SMS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Textarea
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleSendSms} disabled={!selectedDevice}>
              Send SMS
            </Button>
          </div>

          {/* USSD Command */}
          <div className="space-y-2">
            <h3 className="font-medium">Send USSD</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="USSD code (e.g., *100#)"
                value={ussdCode}
                onChange={(e) => setUssdCode(e.target.value)}
              />
              <Button onClick={handleSendUssd} disabled={!selectedDevice}>
                Send USSD
              </Button>
            </div>
          </div>

          {/* Device Control */}
          <div className="space-y-2">
            <h3 className="font-medium">Device Control</h3>
            <div className="flex space-x-2">
              <Button onClick={handleFindDevice} disabled={!selectedDevice}>
                Find Device
              </Button>
              <Button onClick={handleStartAlarm} disabled={!selectedDevice}>
                Start Alarm
              </Button>
              <Button onClick={handleStopAlarm} disabled={!selectedDevice}>
                Stop Alarm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">No notifications</p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 10).map((notification) => (
                <div key={notification.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{notification.title}</p>
                    <Badge variant={notification.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {notification.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 