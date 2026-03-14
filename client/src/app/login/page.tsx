import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Captcha, type CaptchaHandle, isCaptchaEnabled } from '@/components/ui/Captcha';
import { SocialLoginButtons } from '@/components/ui/SocialLoginButtons';
import api from '@/lib/api/client';
import { AUTH, USER } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  // Show error from OAuth redirect
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(`Login failed: ${decodeURIComponent(error)}`);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (isCaptchaEnabled() && !captchaRef.current?.getToken()) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }
    setIsLoading(true);
    try {
      const { rememberMe, ...payload } = values;
      const captcha_token = captchaRef.current?.getToken() || undefined;
      const response = await api.post(AUTH.LOGIN, { ...payload, captcha_token });
      const { access_token, refresh_token } = response.data.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      // Fetch full profile with roles & permissions
      const profileRes = await api.get(USER.PROFILE);
      const profile = profileRes.data.data;

      const permissions: string[] = [];
      if (Array.isArray(profile.roles)) {
        for (const role of profile.roles) {
          if (Array.isArray(role.permissions)) {
            for (const perm of role.permissions) {
              const slug = typeof perm === 'string' ? perm : perm.slug;
              if (slug && !permissions.includes(slug)) permissions.push(slug);
            }
          }
        }
      }

      setUser({
        id: profile._id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: Array.isArray(profile.roles) ? profile.roles.map((r: any) => r.slug || r.name) : [],
        permissions,
        status: profile.status,
        avatar: profile.avatar,
        phone: profile.phone,
        isEmailVerified: profile.is_verified,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      });

      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (error) {
      captchaRef.current?.reset();
      handleApiError(error, 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
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
              autoComplete="current-password"
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
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('rememberMe')}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link to="/forgot-password" title="sm" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        <Captcha ref={captchaRef} />

        <div>
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Sign in
          </Button>
        </div>

        <SocialLoginButtons />
      </form>
      
      <div className="mt-8 space-y-2 text-center text-sm text-gray-600">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Register now
          </Link>
        </p>
        <p>
          <Link to="/recover-account" className="text-muted-foreground hover:text-foreground">
            Recover a deleted account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
