import { Button } from '@/components/ui/Button';
import { WifiOff } from 'lucide-react';

export default function NetworkError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center bg-background">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-900/20">
        <WifiOff className="h-12 w-12 text-yellow-500" strokeWidth={1.5} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Connection Lost</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Unable to reach the server. Check your internet connection and try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
        <Button onClick={() => (window.location.href = '/dashboard')}>Dashboard</Button>
      </div>
    </div>
  );
}
