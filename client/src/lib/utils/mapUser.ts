import type { User } from '@/types/auth';

/** Map a raw backend user object (snake_case) to the frontend User type (camelCase) */
export function mapBackendUser(raw: any): User {
  return {
    id: raw._id,
    email: raw.email,
    firstName: raw.first_name || '',
    lastName: raw.last_name || '',
    role: Array.isArray(raw.roles)
      ? raw.roles.map((r: any) => (typeof r === 'string' ? r : r.slug || r.name))
      : [],
    permissions: extractPermissions(raw.roles),
    status: raw.status || 'active',
    avatar: raw.avatar_url || raw.avatar,
    phone: raw.phone,
    isEmailVerified: raw.is_verified ?? false,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function extractPermissions(roles: any[]): string[] {
  const permissions: string[] = [];
  if (!Array.isArray(roles)) return permissions;
  for (const role of roles) {
    if (Array.isArray(role.permissions)) {
      for (const perm of role.permissions) {
        const slug = typeof perm === 'string' ? perm : perm.slug;
        if (slug && !permissions.includes(slug)) permissions.push(slug);
      }
    }
  }
  return permissions;
}
