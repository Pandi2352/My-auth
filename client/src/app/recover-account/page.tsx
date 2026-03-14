import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { AUTH } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type EmailForm = z.infer<typeof emailSchema>;

export default function RecoverAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // If token present, show confirmation flow
  if (token) {
    return <ConfirmRecovery token={token} />;
  }

  // Otherwise show request form
  return <RequestRecovery />;
}

function RequestRecovery() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (values: EmailForm) => {
    setIsLoading(true);
    try {
      await api.post(AUTH.RECOVER_ACCOUNT, values);
      setSent(true);
    } catch (error) {
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
          <h3 className="mt-4 text-lg font-semibold text-foreground">Check your email</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account with <span className="font-medium text-foreground">{getValues('email')}</span> exists
            and is eligible for recovery, we've sent a recovery link.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
            Try another email
          </Button>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
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
          <UserCheck className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Recover your account</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          If your account was deleted, you may be able to recover it within the grace period.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
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

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Send recovery link
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}

function ConfirmRecovery({ token }: { token: string }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await api.post(AUTH.RECOVER_ACCOUNT_CONFIRM, { token });
      setSuccess(true);
      toast.success('Account recovered successfully');
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
          <h3 className="mt-4 text-lg font-semibold text-foreground">Account recovered!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has been restored. You can now sign in with your existing credentials.
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
      <div className="flex flex-col items-center text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <UserCheck className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">Confirm account recovery</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Click the button below to restore your deleted account and all associated data.
        </p>
        <Button className="mt-6" onClick={handleConfirm} isLoading={isLoading}>
          Recover my account
        </Button>
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
