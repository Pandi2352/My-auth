import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ShieldX } from 'lucide-react';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
        <ShieldX className="h-12 w-12 text-red-500" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-foreground">403</h1>
        <p className="mt-2 text-lg font-medium text-foreground">Access Denied</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          You don't have permission to access this page. Contact your administrator if you believe this is an error.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
      </div>
    </div>
  );
}
