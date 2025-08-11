import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { configService, SmsMonitoringConfig } from '@/services/configService'
import { toast } from 'sonner'

export function SmsMonitoringConfigComponent() {
  const [config, setConfig] = useState<SmsMonitoringConfig>({
    monitoring_window: 10,
    min_sms_for_check: 5,
    maintenance_threshold: 5,
    check_interval_minutes: 15
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configService.getSmsMonitoringConfig()
      setConfig(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
      toast.error('Failed to load SMS monitoring configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      // Validate config
      if (config.min_sms_for_check > config.monitoring_window) {
        setError('Minimum SMS for check cannot be greater than monitoring window')
        return
      }

      const result = await configService.updateSmsMonitoringConfig(config)
      toast.success(result.message || 'SMS monitoring configuration updated successfully and reloaded')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration')
      toast.error('Failed to update SMS monitoring configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof SmsMonitoringConfig, value: string) => {
    const numValue = parseInt(value) || 0
    setConfig(prev => ({
      ...prev,
      [field]: numValue
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Configuration...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Monitoring Configuration</CardTitle>
        <CardDescription>
          Configure SMS monitoring parameters for system health checks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="monitoring_window">Monitoring Window</Label>
            <Input
              id="monitoring_window"
              type="number"
              min="1"
              value={config.monitoring_window}
              onChange={(e) => handleInputChange('monitoring_window', e.target.value)}
              placeholder="10"
            />
            <p className="text-sm text-muted-foreground">
              Number of recent SMS messages to check
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_sms_for_check">Minimum SMS for Check</Label>
            <Input
              id="min_sms_for_check"
              type="number"
              min="1"
              max={config.monitoring_window}
              value={config.min_sms_for_check}
              onChange={(e) => handleInputChange('min_sms_for_check', e.target.value)}
              placeholder="5"
            />
            <p className="text-sm text-muted-foreground">
              Minimum SMS count before starting health checks
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_threshold">Maintenance Threshold</Label>
            <Input
              id="maintenance_threshold"
              type="number"
              min="1"
              value={config.maintenance_threshold}
              onChange={(e) => handleInputChange('maintenance_threshold', e.target.value)}
              placeholder="5"
            />
            <p className="text-sm text-muted-foreground">
              Number of failed SMS to trigger maintenance mode
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="check_interval_minutes">Check Interval (Minutes)</Label>
            <Input
              id="check_interval_minutes"
              type="number"
              min="1"
              value={config.check_interval_minutes}
              onChange={(e) => handleInputChange('check_interval_minutes', e.target.value)}
              placeholder="15"
            />
            <p className="text-sm text-muted-foreground">
              How often to run monitoring checks
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 