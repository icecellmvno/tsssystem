import { useEffect } from 'react';
import type { FormEventHandler } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import AuthCardLayout from '@/layouts/auth/auth-card-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import TextLink from '@/components/text-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AuthSimpleLayout from '@/layouts/auth/auth-simple-layout';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
    const [formData, setFormData] = useState({
        login: '',
        password: '',
        remember: false,
    });
    
    const navigate = useNavigate();
    const { login, loading, error, success, clearError, clearSuccess, isAuthenticated } = useAuthStore();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Handle error messages
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearError();
        }
    }, [error, clearError]);

    // Handle success messages
    useEffect(() => {
        if (success) {
            toast.success(success);
            clearSuccess();
        }
    }, [success, clearSuccess]);

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            await login({
                username: formData.login,
                password: formData.password,
                rememberMe: formData.remember,
            });
            // Navigation will happen automatically via the useEffect above
            // when isAuthenticated becomes true
        } catch (err) {
            // Error is handled by the store and displayed via toast
            console.error('Login error:', err);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <AuthSimpleLayout>
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login">Email or Username</Label>
                            <Input
                                id="login"
                                type="text"
                                placeholder="example@email.com or username"
                                value={formData.login}
                                className={errors.login ? 'border-red-500' : ''}
                                onChange={(e) => handleInputChange('login', e.target.value)}
                                required
                                autoFocus
                                disabled={loading}
                            />
                            {errors.login && (
                                <p className="text-sm text-red-500">{errors.login}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={formData.remember}
                                    onCheckedChange={(checked) => handleInputChange('remember', checked as boolean)}
                                    disabled={loading}
                                />
                                <Label htmlFor="remember" className="text-sm">
                                    Remember me
                                </Label>
                            </div>
                            <TextLink to="/forgot-password" className="text-sm">
                                Forgot password?
                            </TextLink>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </AuthSimpleLayout>
    );
}
