import { useAuthStore } from '@/stores/authStore';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];

  const can = (permission: string): boolean => permissions.includes(permission);
  const canAny = (...perms: string[]): boolean => perms.some((p) => permissions.includes(p));
  const canAll = (...perms: string[]): boolean => perms.every((p) => permissions.includes(p));

  return { can, canAny, canAll, permissions };
}
