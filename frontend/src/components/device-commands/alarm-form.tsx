import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AlarmFormProps {
  onSubmit: (data: { message: string }) => void;
  onCancel?: () => void;
  isLoading: boolean;
}

export function AlarmForm({ onSubmit, onCancel, isLoading }: AlarmFormProps) {
  const [formData, setFormData] = useState({
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="message">Alarm Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Enter alarm message (optional)..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Leave empty to use default alarm message
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Starting...' : 'Start Alarm'}
        </Button>
      </div>
    </form>
  );
} 