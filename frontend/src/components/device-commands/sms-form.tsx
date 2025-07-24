import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SmsFormProps {
  onSubmit: (data: { to: string; message: string; sim_slot: number }) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

export function SmsForm({ onSubmit, onCancel, isLoading }: SmsFormProps) {
  const [formData, setFormData] = useState({
    to: '',
    message: '',
    sim_slot: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="to">Phone Number</Label>
        <Input
          id="to"
          type="tel"
          value={formData.to}
          onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
          placeholder="+905551234567"
          required
        />
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
      </div>

      <div>
        <Label htmlFor="sim_slot">SIM Slot</Label>
        <Select value={formData.sim_slot.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, sim_slot: parseInt(value) }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">SIM 1</SelectItem>
            <SelectItem value="2">SIM 2</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send SMS'}
        </Button>
      </div>
    </form>
  );
} 