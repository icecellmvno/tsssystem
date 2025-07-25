
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Save, Download, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface EnvVar {
  [key: string]: string;
}
interface Section {
  title: string;
  vars: string[];
}

interface Props {
  envVars: EnvVar;
  sections: {
    [key: string]: Section;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Settings',
    href: '/settings',
  },
  {
    title: 'Environment',
    href: '/settings/environment',
  },
];

export default function Environment({ envVars, sections }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    envVars: envVars
  });

  // Type assertion for errors to handle dynamic keys
  const getError = (key: string) => {
    return (errors as any)[key];
  };

  const [backups, setBackups] = useState<any[]>([]);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('/settings/environment/backups');
      const data = await response.json();
      setBackups(data);
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('settings.environment.update'), {
      onSuccess: () => {
        toast.success('Environment variables updated successfully');
      },
      onError: () => {
        toast.error('Failed to update environment variables');
      }
    });
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('/settings/environment/backup', {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      if (response.ok) {
        toast.success('Backup created successfully');
        loadBackups();
      } else {
        toast.error('Failed to create backup');
      }
    } catch (error) {
      toast.error('Error creating backup');
    }
  };

  const handleRestore = async (backupFile: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current settings.')) {
      return;
    }

    try {
      const response = await fetch('/settings/environment/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ backup_file: backupFile }),
      });

      if (response.ok) {
        toast.success('Environment restored successfully');
        window.location.reload();
      } else {
        toast.error('Failed to restore environment');
      }
    } catch (error) {
      toast.error('Error restoring environment');
    }
  };

  const updateEnvVar = (key: string, value: string) => {
    setData('envVars', {
      ...data.envVars,
      [key]: value
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Environment Settings" />
      
      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-6 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Environment Settings</h1>
            <p className="text-muted-foreground">
              Manage application environment variables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleBackup}>
              <Download className="mr-2 h-4 w-4" />
              Backup
            </Button>
            <Button onClick={handleSubmit} disabled={processing}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Environment Variables */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  Configure application settings and connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Tabs defaultValue="database" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="database">Database</TabsTrigger>
                      <TabsTrigger value="smpp_server">SMPP Server</TabsTrigger>
                      <TabsTrigger value="rabbitmq">RabbitMQ</TabsTrigger>
                      <TabsTrigger value="app">App</TabsTrigger>
                      <TabsTrigger value="mail">Mail</TabsTrigger>
                    </TabsList>

                    {Object.entries(sections).map(([sectionKey, section]) => (
                      <TabsContent key={sectionKey} value={sectionKey} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.vars.map((varName) => (
                            <div key={varName} className="space-y-2">
                              <Label htmlFor={varName} className="text-sm font-medium">
                                {varName}
                              </Label>
                              <Input
                                id={varName}
                                type={varName.includes('PASSWORD') || varName.includes('KEY') ? 'password' : 'text'}
                                value={data.envVars[varName] || ''}
                                onChange={(e) => updateEnvVar(varName, e.target.value)}
                                placeholder={`Enter ${varName}`}
                                className={getError(`envVars.${varName}`) ? 'border-red-500' : ''}
                              />
                              {getError(`envVars.${varName}`) && (
                                <p className="text-sm text-red-500">{getError(`envVars.${varName}`)}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Backups */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Backups</CardTitle>
                <CardDescription>
                  Manage environment backups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backups?.length === 0 ? (
                    <div className="text-center py-8">
                      <Download className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No backups found</p>
                    </div>
                  ) : (
                    backups?.map((backup) => (
                      <div key={backup.filename} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{backup.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(backup.size)} • {formatDate(backup.modified)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestore(backup.filename)}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Important Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• Changes take effect immediately</p>
                  <p>• Always backup before making changes</p>
                  <p>• Some changes may require restart</p>
                  <p>• Keep API keys secure</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 
