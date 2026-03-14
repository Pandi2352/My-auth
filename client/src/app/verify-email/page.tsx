import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api/client';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        await api.post('/auth/verify-email', { token });
        setStatus('success');
        toast.success('Email verified successfully!');
      } catch (error) {
        setStatus('error');
        toast.error('Email verification failed. The token may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <AuthLayout>
      <div className="text-center py-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Verifying your email...</h3>
            <p className="mt-2 text-sm text-gray-600">Please wait a moment.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Email Verified!</h3>
            <p className="mt-2 text-sm text-gray-600">Your account is now active and ready to use.</p>
            <Button className="mt-6 w-full" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Verification Failed</h3>
            <p className="mt-2 text-sm text-gray-600">The link is invalid or has expired.</p>
            <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
