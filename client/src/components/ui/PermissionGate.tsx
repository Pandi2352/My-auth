import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permission?: string;
  any?: string[];
  all?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, any, all, fallback = null, children }: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = true;

  if (permission) allowed = can(permission);
  if (any) allowed = canAny(...any);
  if (all) allowed = canAll(...all);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
