import { AppLayout } from '@/layouts/app-layout'
import { SmsMonitoringConfigComponent } from '@/components/SmsMonitoringConfig'

export function SmsMonitoringPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SMS Monitoring Configuration</h2>
          <p className="text-muted-foreground">
            Configure SMS monitoring parameters for system health checks.
          </p>
        </div>
        
        <SmsMonitoringConfigComponent />
      </div>
    </AppLayout>
  )
} 