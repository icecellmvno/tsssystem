import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SmsFormProps {
  onSubmit: (data: { to: string; message: string; sim_slot: number }) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

interface SmsCountResult {
  totalSms: number;
  charsLeft: number;
  limit: number;
}

export function SmsForm({ onSubmit, onCancel, isLoading }: SmsFormProps) {
  const [formData, setFormData] = useState({
    to: '',
    message: '',
    sim_slot: 1,
  });

  const [smsCount, setSmsCount] = useState<SmsCountResult>({
    totalSms: 1,
    charsLeft: 160,
    limit: 160,
  });

  // Calculate SMS count when message changes
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).SMS) {
      const sms = new (window as any).SMS();
      const result = sms.count(formData.message);
      setSmsCount({
        totalSms: result.totalSms,
        charsLeft: result.charsLeft,
        limit: result.limit,
      });
    } else {
      // Fallback calculation
      const messageLength = formData.message.length;
      const limit = 160;
      const totalSms = Math.ceil(messageLength / limit);
      const charsLeft = limit - (messageLength % limit);
      setSmsCount({ totalSms, charsLeft, limit });
    }
  }, [formData.message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getSmsCountColor = () => {
    if (smsCount.totalSms === 1) return 'bg-green-100 text-green-800';
    if (smsCount.totalSms <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {formData.message.length} chars
          </Badge>
          <Badge className={`text-xs ${getSmsCountColor()}`}>
            {smsCount.totalSms} SMS
          </Badge>
          {smsCount.charsLeft > 0 && smsCount.charsLeft < smsCount.limit && (
            <Badge variant="secondary" className="text-xs">
              {smsCount.charsLeft} left
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            (Limit: {smsCount.limit} chars per SMS)
          </span>
        </div>
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