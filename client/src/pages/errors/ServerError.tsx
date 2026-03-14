import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ServerCrash } from 'lucide-react';

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
        <ServerCrash className="h-12 w-12 text-orange-500" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-foreground">500</h1>
        <p className="mt-2 text-lg font-medium text-foreground">Server Error</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Something went wrong on our end. Please try again later.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
        <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
      </div>
    </div>
  );
}
