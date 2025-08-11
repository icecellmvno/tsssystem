import { AppLayout } from '@/layouts/app-layout'

export function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your TSIM Socket Server settings and preferences.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure general application settings.
              </p>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage security and authentication settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
} 