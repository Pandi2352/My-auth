import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Users',
  create: 'Create',
  roles: 'Roles',
  groups: 'Groups',
  invitations: 'Invitations',
  security: 'Security',
  sessions: 'Sessions',
  'api-keys': 'API Keys',
  'audit-logs': 'Audit Logs',
  analytics: 'Analytics',
  advertisements: 'Advertisements',
  'custom-fields': 'Custom Fields',
  'system-logs': 'System Logs',
  connectors: 'Connectors',
  settings: 'Settings',
  profile: 'Profile',
  permissions: 'Permissions',
};

interface Crumb {
  label: string;
  path: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    const label = ROUTE_LABELS[segment];
    if (label) {
      crumbs.push({ label, path: currentPath });
    } else if (segment === 'create') {
      crumbs.push({ label: 'Create', path: currentPath });
    } else {
      // Dynamic segment (e.g., :id) — show as "Details"
      crumbs.push({ label: 'Details', path: currentPath });
    }
  }

  return crumbs;
}

export function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  // Don't render on the dashboard root
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      <Link
        to="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
