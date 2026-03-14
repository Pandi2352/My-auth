import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/PageLoader';
import { useAuthStore } from '@/stores/authStore';
import { mapBackendUser } from '@/lib/utils/mapUser';
import api from '@/lib/api/client';
import { USER } from '@/lib/api/endpoints';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Social login failed: ${decodeURIComponent(error)}`);
      navigate('/login', { replace: true });
      return;
    }

    if (!access_token || !refresh_token) {
      toast.error('Missing authentication tokens');
      navigate('/login', { replace: true });
      return;
    }

    // Store tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    // Fetch profile and set user
    api
      .get(USER.PROFILE)
      .then((res) => {
        const profile = res.data.data;
        setUser(mapBackendUser(profile));
        toast.success('Signed in successfully');
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        toast.error('Failed to load profile after social login');
        navigate('/login', { replace: true });
      });
  }, [searchParams, navigate, setUser]);

  return <PageLoader />;
}
