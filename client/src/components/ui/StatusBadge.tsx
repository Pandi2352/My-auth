import { cn } from '@/lib/utils/cn';

type Status = 'success' | 'warning' | 'error' | 'info' | 'default';

interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
  variant?: 'default' | 'flat' | 'outline';
}

const styles: Record<Status, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200',
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

export function StatusBadge({ status, label, className, variant = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variant === 'default' && 'rounded-full px-2.5 py-0.5 text-xs',
        variant === 'flat' && 'rounded px-1.5 py-0 text-[10px] bg-opacity-50',
        variant === 'outline' && 'rounded-full px-2.5 py-0.5 text-xs border bg-transparent',
        styles[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
