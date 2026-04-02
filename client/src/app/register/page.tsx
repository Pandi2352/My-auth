import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Captcha, type CaptchaHandle, isCaptchaEnabled } from '@/components/ui/Captcha';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { PageLoader } from '@/components/ui/PageLoader';
import { AlertTriangle } from 'lucide-react';
import api from '@/lib/api/client';
import { AUTH, SETTINGS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const captchaRef = useRef<CaptchaHandle>(null);

  // Check if public registration is allowed
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await api.get(SETTINGS.PUBLIC_CONFIG);
        setRegistrationEnabled(res.data.registration_enabled);
      } catch {
        setRegistrationEnabled(true); // fail-open
      } finally {
        setChecking(false);
      }
    };
    checkConfig();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (values: RegisterFormValues) => {
    if (isCaptchaEnabled() && !captchaRef.current?.getToken()) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }
    setIsLoading(true);
    try {
      const { confirmPassword, ...rest } = values;
      const captcha_token = captchaRef.current?.getToken() || undefined;
      await api.post(AUTH.REGISTER, {
        first_name: rest.firstName,
        last_name: rest.lastName,
        email: rest.email,
        password: rest.password,
        captcha_token,
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    } catch (error) {
      captchaRef.current?.reset();
      handleApiError(error, 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checking) return <PageLoader />;

  if (!registrationEnabled) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-4 text-center py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Registration Disabled</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Public registration is currently disabled by the administrator. Please contact your admin to receive an invitation.
          </p>
          <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 mt-2">
            ← Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <div className="mt-1">
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                {...register('firstName')}
                className={errors.firstName ? 'border-red-500 focus-visible:ring-red-600' : ''}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <div className="mt-1">
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                {...register('lastName')}
                className={errors.lastName ? 'border-red-500 focus-visible:ring-red-600' : ''}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-600' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
              className={errors.password ? 'border-red-500 focus-visible:ring-red-600' : ''}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <PasswordStrengthMeter password={passwordValue} />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="mt-1">
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-600' : ''}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Captcha ref={captchaRef} />

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
