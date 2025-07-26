import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BulkSmsForm } from '@/components/bulk-sms-form';
import { 
    MessageSquare, 
    Smartphone, 
    Phone, 
    Image, 
    Send,
    Users,
    User,
    MessageCircle
} from 'lucide-react';

interface DeviceGroup {
    id: number;
    device_group: string;
    country_site: string;
}

interface Device {
    id: number;
    device_id: string;
    device_name: string;
    device_group_id: number;
}

interface Props {
    deviceGroups: DeviceGroup[];
    devices: Device[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Messaging', href: '/messaging' },
];

export default function MessagingIndex({ deviceGroups, devices }: Props) {
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState('sms');
    const [bulkSmsDialog, setBulkSmsDialog] = useState(false);
    const [isBulkSmsLoading, setIsBulkSmsLoading] = useState(false);

    // SMS Form
    const [smsForm, setSmsForm] = useState({
        target_type: 'device',
        device_id: '',
        device_group_id: '',
        to: '',
        message: '',
        sim_slot: 1,
    });

    // RCS Form
    const [rcsForm, setRcsForm] = useState({
        target_type: 'device',
        device_id: '',
        device_group_id: '',
        to: '',
        message: '',
        title: '',
        sim_slot: 1,
    });

    // USSD Form
    const [ussdForm, setUssdForm] = useState({
        target_type: 'device',
        device_id: '',
        device_group_id: '',
        ussd_code: '',
        sim_slot: 1,
    });

    // MMS Form
    const [mmsForm, setMmsForm] = useState({
        target_type: 'device',
        device_id: '',
        device_group_id: '',
        to: '',
        subject: '',
        message: '',
        attachment_url: '',
        sim_slot: 1,
    });

    const handleSmsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement SMS sending
        console.log('SMS form data:', smsForm);
        setSmsForm({
            target_type: 'device',
            device_id: '',
            device_group_id: '',
            to: '',
            message: '',
            sim_slot: 1,
        });
    };

    const handleRcsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement RCS sending
        console.log('RCS form data:', rcsForm);
        setRcsForm({
            target_type: 'device',
            device_id: '',
            device_group_id: '',
            to: '',
            message: '',
            title: '',
            sim_slot: 1,
        });
    };

    const handleUssdSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement USSD sending
        console.log('USSD form data:', ussdForm);
        setUssdForm({
            target_type: 'device',
            device_id: '',
            device_group_id: '',
            ussd_code: '',
            sim_slot: 1,
        });
    };

    const handleMmsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement MMS sending
        console.log('MMS form data:', mmsForm);
        setMmsForm({
            target_type: 'device',
            device_id: '',
            device_group_id: '',
            to: '',
            subject: '',
            message: '',
            attachment_url: '',
            sim_slot: 1,
        });
    };

    const handleBulkSmsSubmit = async (data: {
        device_group_id: number;
        phone_numbers: string[];
        message: string;
        sim_slot: number;
        priority: string;
    }) => {
        setIsBulkSmsLoading(true);
        try {
            const response = await fetch('/api/bulk-sms/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Bulk SMS sent successfully!\nTotal sent: ${result.total_sent}\nTotal failed: ${result.total_failed}`);
                setBulkSmsDialog(false);
            } else {
                const errorData = await response.json();
                alert(`Failed to send bulk SMS: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error sending bulk SMS:', error);
            alert('Failed to send bulk SMS');
        } finally {
            setIsBulkSmsLoading(false);
        }
    };

    const renderTargetSelector = (form: any, setForm: any, formName: string) => (
        <div className="space-y-4">
            <div>
                <Label htmlFor={`${formName}_target_type`}>Target Type</Label>
                <Select
                    value={form.target_type}
                    onValueChange={(value) => {
                        setForm({ ...form, target_type: value, device_id: '', device_group_id: '' });
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="device">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Single Device
                            </div>
                        </SelectItem>
                        <SelectItem value="device_group">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Device Group
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {form.target_type === 'device' ? (
                <div>
                    <Label htmlFor={`${formName}_device_id`}>Select Device</Label>
                    <Select
                        value={form.device_id}
                        onValueChange={(value) => setForm({ ...form, device_id: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a device" />
                        </SelectTrigger>
                        <SelectContent>
                            {devices.map((device) => (
                                <SelectItem key={device.id} value={device.id.toString()}>
                                    {device.device_name} ({device.device_id})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : (
                <div>
                    <Label htmlFor={`${formName}_device_group_id`}>Select Device Group</Label>
                    <Select
                        value={form.device_group_id}
                        onValueChange={(value) => setForm({ ...form, device_group_id: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a device group" />
                        </SelectTrigger>
                        <SelectContent>
                            {deviceGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id.toString()}>
                                    {group.device_group} ({group.country_site})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div>
                <Label htmlFor={`${formName}_sim_slot`}>SIM Slot</Label>
                <Select
                    value={form.sim_slot.toString()}
                    onValueChange={(value) => setForm({ ...form, sim_slot: parseInt(value) })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select SIM slot" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">SIM 1</SelectItem>
                        <SelectItem value="2">SIM 2</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderSmsForm = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Send SMS
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSmsSubmit} className="space-y-6">
                    {renderTargetSelector(smsForm, setSmsForm, 'sms')}

                    <div>
                        <Label htmlFor="sms_to">To (Phone Number)</Label>
                        <Input
                            id="sms_to"
                            type="tel"
                            value={smsForm.to}
                            onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                            placeholder="+905551234567"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="sms_message">Message</Label>
                        <Textarea
                            id="sms_message"
                            value={smsForm.message}
                            onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                            placeholder="Enter your SMS message..."
                            rows={4}
                            maxLength={160}
                            required
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                            {smsForm.message.length}/160 characters
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" className="flex-1">
                            <Send className="mr-2 h-4 w-4" />
                            Send SMS
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setBulkSmsDialog(true)}
                            className="flex items-center gap-2"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Bulk SMS
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );

    const renderRcsForm = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Send RCS
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleRcsSubmit} className="space-y-6">
                    {renderTargetSelector(rcsForm, setRcsForm, 'rcs')}

                    <div>
                        <Label htmlFor="rcs_to">To (Phone Number)</Label>
                        <Input
                            id="rcs_to"
                            type="tel"
                            value={rcsForm.to}
                            onChange={(e) => setRcsForm({ ...rcsForm, to: e.target.value })}
                            placeholder="+905551234567"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="rcs_title">Title (Optional)</Label>
                        <Input
                            id="rcs_title"
                            value={rcsForm.title}
                            onChange={(e) => setRcsForm({ ...rcsForm, title: e.target.value })}
                            placeholder="Message title"
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <Label htmlFor="rcs_message">Message</Label>
                        <Textarea
                            id="rcs_message"
                            value={rcsForm.message}
                            onChange={(e) => setRcsForm({ ...rcsForm, message: e.target.value })}
                            placeholder="Enter your RCS message..."
                            rows={4}
                            maxLength={1000}
                            required
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                            {rcsForm.message.length}/1000 characters
                        </div>
                    </div>

                    <Button type="submit" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Send RCS
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const renderUssdForm = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Execute USSD
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleUssdSubmit} className="space-y-6">
                    {renderTargetSelector(ussdForm, setUssdForm, 'ussd')}

                    <div>
                        <Label htmlFor="ussd_code">USSD Code</Label>
                        <Input
                            id="ussd_code"
                            value={ussdForm.ussd_code}
                            onChange={(e) => setUssdForm({ ...ussdForm, ussd_code: e.target.value })}
                            placeholder="*100# or *123*1#"
                            maxLength={50}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Execute USSD
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    const renderMmsForm = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Send MMS
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleMmsSubmit} className="space-y-6">
                    {renderTargetSelector(mmsForm, setMmsForm, 'mms')}

                    <div>
                        <Label htmlFor="mms_to">To (Phone Number)</Label>
                        <Input
                            id="mms_to"
                            type="tel"
                            value={mmsForm.to}
                            onChange={(e) => setMmsForm({ ...mmsForm, to: e.target.value })}
                            placeholder="+905551234567"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="mms_subject">Subject</Label>
                        <Input
                            id="mms_subject"
                            value={mmsForm.subject}
                            onChange={(e) => setMmsForm({ ...mmsForm, subject: e.target.value })}
                            placeholder="MMS subject"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="mms_message">Message (Optional)</Label>
                        <Textarea
                            id="mms_message"
                            value={mmsForm.message}
                            onChange={(e) => setMmsForm({ ...mmsForm, message: e.target.value })}
                            placeholder="Enter your MMS message..."
                            rows={3}
                            maxLength={1000}
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                            {mmsForm.message.length}/1000 characters
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="mms_attachment_url">Attachment URL</Label>
                        <Input
                            id="mms_attachment_url"
                            type="url"
                            value={mmsForm.attachment_url}
                            onChange={(e) => setMmsForm({ ...mmsForm, attachment_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            required
                        />
                        <div className="text-sm text-muted-foreground mt-1">
                            Enter the URL of the image, video, or document to send
                        </div>
                    </div>

                    <Button type="submit" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Send MMS
                    </Button>
                </form>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messaging</h1>
                    <p className="text-muted-foreground">
                        Send SMS, RCS, USSD, and MMS messages to devices or device groups
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="sms" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            SMS
                        </TabsTrigger>
                        <TabsTrigger value="rcs" className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            RCS
                        </TabsTrigger>
                        <TabsTrigger value="ussd" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            USSD
                        </TabsTrigger>
                        <TabsTrigger value="mms" className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            MMS
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="sms" className="mt-6">
                        {renderSmsForm()}
                    </TabsContent>

                    <TabsContent value="rcs" className="mt-6">
                        {renderRcsForm()}
                    </TabsContent>

                    <TabsContent value="ussd" className="mt-6">
                        {renderUssdForm()}
                    </TabsContent>

                    <TabsContent value="mms" className="mt-6">
                        {renderMmsForm()}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Bulk SMS Dialog */}
            <Dialog open={bulkSmsDialog} onOpenChange={setBulkSmsDialog}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Send Bulk SMS</DialogTitle>
                        <DialogDescription>
                            Send SMS messages to multiple recipients using devices from a device group.
                        </DialogDescription>
                    </DialogHeader>
                    <BulkSmsForm
                        deviceGroups={deviceGroups.map(group => ({
                            id: group.id,
                            device_group: group.device_group,
                            sitename: group.country_site
                        }))}
                        onSubmit={handleBulkSmsSubmit}
                        onCancel={() => setBulkSmsDialog(false)}
                        isLoading={isBulkSmsLoading}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 