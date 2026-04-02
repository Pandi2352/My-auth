import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import AuthLayout from '@/components/layout/AuthLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ForcePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get user details from location state passed from login
  const { user_id, email, currentPassword: initialPassword } = location.state || {};

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: initialPassword || '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const newPassword = watch('newPassword');

  if (!user_id || !email) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              We couldn't find your temporary login session. Please go back to login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await api.post('/auth/force-password-change', {
        user_id,
        current_pass: data.currentPassword,
        new_pass: data.newPassword
      });
      
      setIsSuccess(true);
      toast.success('Password updated successfully');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      const msg = error.response?.data?.error?.error_description || 'Failed to update password';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl mb-2">Password Updated!</CardTitle>
            <CardDescription className="text-base mb-8">
              Your password has been successfully updated. You can now use your new password to sign in.
            </CardDescription>
            <Button onClick={() => navigate('/login')} className="w-full py-6 text-lg">
              Sign In Now
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Redirecting you to login in a few seconds...
            </p>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl text-center">Password Update Required</CardTitle>
          <CardDescription className="text-center">
            For security reasons, your account for <strong>{email}</strong> requires a password update before you can continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Current Temporary Password</label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  {...register('currentPassword')}
                  className={errors.currentPassword ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" /> }
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-destructive">{errors.currentPassword.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">New Password</label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                {...register('newPassword')}
                className={errors.newPassword ? 'border-destructive' : ''}
              />
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword.message as string}</p>
              )}
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Confirm New Password</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message as string}</p>
              )}
            </div>

            <Button type="submit" className="w-full py-6 mt-2" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Updating Password...
                </div>
              ) : (
                "Save & Secure Account"
              )}
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={() => navigate('/login')}
            >
              Cancel & Sign Out
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
