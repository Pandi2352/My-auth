import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { usePermissions } from '@/hooks/usePermissions';
import { useFavorites } from '@/hooks/useFavorites';
import { useAppSettings } from '@/hooks/useAppSettings';
import type { NavItem } from '@/types';
import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  Settings,
  ScrollText,
  BarChart3,
  UserPlus,
  Link2,
  UsersRound,
  Monitor,
  Megaphone,
  ChevronLeft,
  Hexagon,
  ShieldCheck,
  Star,
  ListChecks,
  FileText,
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  Settings,
  ScrollText,
  BarChart3,
  UserPlus,
  Link2,
  UsersRound,
  Monitor,
  Megaphone,
  ShieldCheck,
  ListChecks,
  FileText,
};

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Analytics', path: '/analytics', icon: 'BarChart3', permission: 'analytics:read' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', path: '/users', icon: 'Users', permission: 'user:read' },
      { label: 'Roles', path: '/roles', icon: 'Shield', permission: 'role:read' },
      { label: 'Groups', path: '/groups', icon: 'UsersRound', permission: 'group:read' },
      { label: 'Invitations', path: '/invitations', icon: 'UserPlus', permission: 'invitation:read' },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Security', path: '/security', icon: 'ShieldCheck' },
      { label: 'Sessions', path: '/sessions', icon: 'Monitor' },
      { label: 'API Keys', path: '/api-keys', icon: 'KeyRound' },
      { label: 'Audit Logs', path: '/audit-logs', icon: 'ScrollText', permission: 'audit:read' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Ads', path: '/advertisements', icon: 'Megaphone', permission: 'advertisement:read' },
      { label: 'Custom Fields', path: '/custom-fields', icon: 'ListChecks', permission: 'settings:read' },
      { label: 'Connectors', path: '/connectors', icon: 'Link2', permission: 'connector:read' },
      { label: 'System Logs', path: '/system-logs', icon: 'FileText', permission: 'settings:read' },
      { label: 'Settings', path: '/settings', icon: 'Settings', permission: 'settings:read' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { can } = usePermissions();
  const { favorites, toggle: toggleFav, isFavorite } = useFavorites();
  const { siteName, logoUrl } = useAppSettings();

  // Flatten all permitted items for favorites lookup
  const allItems = navSections
    .flatMap((s) => s.items)
    .filter((item) => !item.permission || can(item.permission));

  const favoriteItems = allItems.filter((item) => favorites.includes(item.path));

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-background transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-border px-3">
        {collapsed ? (
          <button
            onClick={onToggle}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white overflow-hidden"
          >
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-9 w-9 object-cover" />
            ) : (
              <Hexagon className="h-5 w-5" />
            )}
          </button>
        ) : (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="h-8 w-8 object-cover" />
                ) : (
                  <Hexagon className="h-4 w-4" />
                )}
              </div>
              <span className="text-base font-bold text-foreground tracking-tight">{siteName}</span>
            </div>
            <button
              onClick={onToggle}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3">
        {/* Favorites section */}
        {favoriteItems.length > 0 && (
          <div className="mb-3">
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-amber-500">
                Favorites
              </p>
            )}
            {collapsed && (
              <div className="mx-3 mb-2 flex justify-center">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {favoriteItems.map((item) => (
                <SidebarNavItem
                  key={`fav-${item.path}`}
                  item={item}
                  collapsed={collapsed}
                  isFavorite
                  onToggleFavorite={toggleFav}
                />
              ))}
            </ul>
            {!collapsed && <div className="mx-4 mt-3 border-t border-border" />}
            {collapsed && <div className="mx-3 mt-2 border-t border-border" />}
          </div>
        )}

        {/* Regular sections */}
        {filteredSections.map((section, sectionIdx) => (
          <div key={section.label} className={sectionIdx > 0 || favoriteItems.length > 0 ? 'mt-3' : ''}>
            {!collapsed && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.label}
              </p>
            )}
            {collapsed && sectionIdx > 0 && (
              <div className="mx-3 mb-2 border-t border-border" />
            )}

            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed}
                  isFavorite={isFavorite(item.path)}
                  onToggleFavorite={toggleFav}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      {!collapsed && (
        <div className="shrink-0 border-t border-border p-3">
          <button
            onClick={onToggle}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </button>
        </div>
      )}
    </aside>
  );
}

// ── Individual Nav Item ─────────────────────────────────────
function SidebarNavItem({
  item,
  collapsed,
  isFavorite,
  onToggleFavorite,
}: {
  item: NavItem;
  collapsed: boolean;
  isFavorite: boolean;
  onToggleFavorite: (path: string) => void;
}) {
  const Icon = iconMap[item.icon] ?? LayoutDashboard;

  return (
    <li className="group relative">
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          cn(
            'relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            collapsed && 'justify-center px-0',
          )
        }
        title={collapsed ? item.label : undefined}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
            )}
            <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
            {!collapsed && <span className="flex-1">{item.label}</span>}
          </>
        )}
      </NavLink>

      {/* Favorite star — show on hover (expanded only) */}
      {!collapsed && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item.path);
          }}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-opacity',
            isFavorite
              ? 'opacity-100 text-amber-500'
              : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-500',
          )}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={cn('h-3 w-3', isFavorite && 'fill-amber-500')} />
        </button>
      )}
    </li>
  );
}
