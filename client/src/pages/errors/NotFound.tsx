import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
        <FileQuestion className="h-12 w-12 text-blue-500" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-lg font-medium text-foreground">Page Not Found</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
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
