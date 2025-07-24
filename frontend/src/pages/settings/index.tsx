import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, User, Lock, Palette, Database } from 'lucide-react';

const settingsItems = [
  {
    title: 'Profile',
    description: 'Update your account profile information and email address.',
    icon: User,
    href: route('profile.edit'),
  },
  {
    title: 'Password',
    description: 'Update your password to keep your account secure.',
    icon: Lock,
    href: route('password.edit'),
  },
  {
    title: 'Appearance',
    description: 'Customize the appearance of the application.',
    icon: Palette,
    href: route('settings.appearance'),
  },
  {
    title: 'Environment',
    description: 'Manage application environment variables and settings.',
    icon: Database,
    href: route('settings.environment'),
  },
];

export default function Settings() {
  return (
    <>
      <Head title="Settings" />
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and application preferences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsItems.map((item) => (
            <Link key={item.title} href={item.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="ml-2 text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
} 