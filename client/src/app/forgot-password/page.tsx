import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Captcha, type CaptchaHandle, isCaptchaEnabled } from '@/components/ui/Captcha';
import api from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    if (isCaptchaEnabled() && !captchaRef.current?.getToken()) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }
    setIsLoading(true);
    try {
      const captcha_token = captchaRef.current?.getToken() || undefined;
      await api.post(AUTH.FORGOT_PASSWORD, { ...values, captcha_token });
      setSent(true);
    } catch (error) {
      captchaRef.current?.reset();
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Check your email</h3>
          <p className="mt-2 text-sm text-gray-600">
            We sent a password reset link to{' '}
            <span className="font-medium text-gray-900">{getValues('email')}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Didn't receive it? Check your spam folder or try again.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setSent(false)}
          >
            Try another email
          </Button>
        </div>
        <p className="mt-8 text-center text-sm text-gray-600">
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500">
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Forgot your password?</h3>
        <p className="mt-1 text-sm text-gray-600">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-600' : ''}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <Captcha ref={captchaRef} />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send reset link
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
