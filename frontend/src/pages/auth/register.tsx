import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function Register() {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Partial<RegisterForm>>({});
    const [formData, setFormData] = useState<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const navigate = useNavigate();

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Handle register logic here
        console.log('Register attempt:', formData);
        
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            // Navigate to login on success
            navigate('/login');
        }, 1000);
    };

    const handleInputChange = (field: keyof RegisterForm, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={processing}
                            placeholder="Full name"
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            tabIndex={3}
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            disabled={processing}
                            placeholder="Password"
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            required
                            tabIndex={4}
                            autoComplete="new-password"
                            value={formData.password_confirmation}
                            onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                            disabled={processing}
                            placeholder="Confirm password"
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>
                </div>

                <Button type="submit" disabled={processing}>
                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Create account
                </Button>

                <div className="text-center text-sm">
                    Already have an account?{' '}
                    <TextLink to="/login" className="font-medium">
                        Sign in
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
