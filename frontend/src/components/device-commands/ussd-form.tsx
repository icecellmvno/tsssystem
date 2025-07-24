import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UssdFormProps {
  onSubmit: (data: { ussd_code: string; sim_slot: number }) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

export function UssdForm({ onSubmit, onCancel, isLoading }: UssdFormProps) {
  const [formData, setFormData] = useState({
    ussd_code: '',
    sim_slot: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="ussd_code">USSD Code</Label>
        <Input
          id="ussd_code"
          value={formData.ussd_code}
          onChange={(e) => setFormData(prev => ({ ...prev, ussd_code: e.target.value }))}
          placeholder="*100#"
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
          {isLoading ? 'Executing...' : 'Execute USSD'}
        </Button>
      </div>
    </form>
  );
} 