import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import api from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const passwordValue = watch('password', '');

  // No token — show error
  if (!token) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-7 w-7 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Invalid reset link</h3>
          <p className="mt-2 text-sm text-gray-600">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button className="mt-6" onClick={() => navigate('/forgot-password')}>
            Request new link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await api.post(AUTH.RESET_PASSWORD, {
        token,
        password: values.password,
      });
      setSuccess(true);
      toast.success('Password reset successfully');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Password reset!</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Button className="mt-6" onClick={() => navigate('/login')}>
            Go to login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Lock className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Set new password</h3>
        <p className="mt-1 text-sm text-gray-600">
          Your new password must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
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
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
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
            Confirm password
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

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Reset password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
