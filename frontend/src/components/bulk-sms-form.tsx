import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Send, AlertTriangle } from 'lucide-react';

interface BulkSmsFormProps {
  deviceGroups: Array<{
    id: number;
    device_group: string;
    sitename: string;
  }>;
  onSubmit: (data: {
    device_group_id: number;
    phone_numbers: string[];
    message: string;
    sim_slot: number;
    priority: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BulkSmsForm({ deviceGroups, onSubmit, onCancel, isLoading }: BulkSmsFormProps) {
  const [formData, setFormData] = useState({
    device_group_id: '',
    phone_numbers: [''],
    message: '',
    sim_slot: 1,
    priority: 'normal',
  });

  const [errors, setErrors] = useState<string[]>([]);

  const addPhoneNumber = () => {
    setFormData(prev => ({
      ...prev,
      phone_numbers: [...prev.phone_numbers, ''],
    }));
  };

  const removePhoneNumber = (index: number) => {
    if (formData.phone_numbers.length > 1) {
      setFormData(prev => ({
        ...prev,
        phone_numbers: prev.phone_numbers.filter((_, i) => i !== index),
      }));
    }
  };

  const updatePhoneNumber = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      phone_numbers: prev.phone_numbers.map((phone, i) => i === index ? value : phone),
    }));
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!formData.device_group_id) {
      newErrors.push('Device group is required');
    }

    if (!formData.message.trim()) {
      newErrors.push('Message is required');
    }

    const validPhoneNumbers = formData.phone_numbers.filter(phone => phone.trim() !== '');
    if (validPhoneNumbers.length === 0) {
      newErrors.push('At least one phone number is required');
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    validPhoneNumbers.forEach(phone => {
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        newErrors.push(`Invalid phone number format: ${phone}`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const validPhoneNumbers = formData.phone_numbers.filter(phone => phone.trim() !== '');
    
    onSubmit({
      device_group_id: parseInt(formData.device_group_id),
      phone_numbers: validPhoneNumbers,
      message: formData.message,
      sim_slot: formData.sim_slot,
      priority: formData.priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="device_group">Device Group</Label>
        <Select 
          value={formData.device_group_id} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, device_group_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a device group" />
          </SelectTrigger>
          <SelectContent>
            {deviceGroups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.device_group} ({group.sitename})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Phone Numbers</Label>
        <div className="space-y-2">
          {formData.phone_numbers.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => updatePhoneNumber(index, e.target.value)}
                placeholder="+905551234567"
                className="flex-1"
              />
              {formData.phone_numbers.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removePhoneNumber(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPhoneNumber}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Phone Number
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Enter your message..."
          rows={4}
          required
        />
        <div className="text-sm text-muted-foreground mt-1">
          {formData.message.length} characters
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sim_slot">SIM Slot</Label>
          <Select 
            value={formData.sim_slot.toString()} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, sim_slot: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">SIM 1</SelectItem>
              <SelectItem value="2">SIM 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select 
            value={formData.priority} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Send className="h-4 w-4 mr-2" />
          {isLoading ? 'Sending...' : `Send to ${formData.phone_numbers.filter(p => p.trim()).length} recipients`}
        </Button>
      </div>
    </form>
  );
} 