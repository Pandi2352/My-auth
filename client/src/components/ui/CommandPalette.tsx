import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Search,
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
  User,
  Plus,
  Lock,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  path: string;
  section: 'navigation' | 'actions';
  keywords?: string[];
  permission?: string;
}

const allItems: CommandItem[] = [
  // Navigation
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', section: 'navigation', keywords: ['home', 'overview'] },
  { id: 'users', label: 'Users', icon: Users, path: '/users', section: 'navigation', keywords: ['members', 'accounts'], permission: 'user:read' },
  { id: 'roles', label: 'Roles', icon: Shield, path: '/roles', section: 'navigation', keywords: ['permissions', 'access'], permission: 'role:read' },
  { id: 'groups', label: 'Groups', icon: UsersRound, path: '/groups', section: 'navigation', keywords: ['teams'], permission: 'group:read' },
  { id: 'invitations', label: 'Invitations', icon: UserPlus, path: '/invitations', section: 'navigation', keywords: ['invite'], permission: 'invitation:read' },
  { id: 'security', label: 'Security', icon: Lock, path: '/security', section: 'navigation', keywords: ['2fa', 'two-factor', 'social', 'login history'] },
  { id: 'sessions', label: 'Sessions', icon: Monitor, path: '/sessions', section: 'navigation', keywords: ['devices', 'active'] },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound, path: '/api-keys', section: 'navigation', keywords: ['tokens', 'keys'] },
  { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText, path: '/audit-logs', section: 'navigation', keywords: ['activity', 'history', 'logs'], permission: 'audit:read' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', section: 'navigation', keywords: ['stats', 'charts', 'metrics'], permission: 'analytics:read' },
  { id: 'advertisements', label: 'Advertisements', icon: Plus, path: '/advertisements', section: 'navigation', keywords: ['ads', 'banners', 'marketing'], permission: 'advertisement:read' },
  { id: 'connectors', label: 'Connectors', icon: Link2, path: '/connectors', section: 'navigation', keywords: ['oauth', 'social', 'providers'], permission: 'connector:read' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', section: 'navigation', keywords: ['config', 'preferences'], permission: 'settings:read' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile', section: 'navigation', keywords: ['account', 'me'] },
  { id: 'permissions', label: 'Permissions', icon: Lock, path: '/permissions', section: 'navigation', keywords: ['access', 'rights'] },

  // Quick Actions
  { id: 'create-user', label: 'Create User', description: 'Add a new user account', icon: Plus, path: '/users/create', section: 'actions', keywords: ['new user', 'add user'], permission: 'user:read' },
  { id: 'create-role', label: 'Create Role', description: 'Define a new role', icon: Plus, path: '/roles/create', section: 'actions', keywords: ['new role', 'add role'], permission: 'role:read' },
  { id: 'create-group', label: 'Create Group', description: 'Create a new group', icon: Plus, path: '/groups/create', section: 'actions', keywords: ['new group', 'add group'], permission: 'group:read' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { can } = usePermissions();

  // Filter items based on permissions
  const availableItems = useMemo(
    () => allItems.filter((item) => !item.permission || can(item.permission)),
    [can],
  );

  // Filter by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return availableItems;
    const q = query.toLowerCase();
    return availableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q)),
    );
  }, [query, availableItems]);

  // Group by section
  const navItems = filtered.filter((i) => i.section === 'navigation');
  const actionItems = filtered.filter((i) => i.section === 'actions');

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Reset active index on filter change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        handleSelect(filtered[activeIndex].path);
      }
    },
    [filtered, activeIndex, handleSelect],
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg rounded-xl border border-border bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}

          {navItems.length > 0 && (
            <div>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Pages
              </div>
              {navItems.map((item) => {
                const globalIndex = filtered.indexOf(item);
                return (
                  <CommandItem
                    key={item.id}
                    item={item}
                    isActive={globalIndex === activeIndex}
                    dataIndex={globalIndex}
                    onSelect={handleSelect}
                    onHover={() => setActiveIndex(globalIndex)}
                  />
                );
              })}
            </div>
          )}

          {actionItems.length > 0 && (
            <div className={navItems.length > 0 ? 'mt-2' : ''}>
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </div>
              {actionItems.map((item) => {
                const globalIndex = filtered.indexOf(item);
                return (
                  <CommandItem
                    key={item.id}
                    item={item}
                    isActive={globalIndex === activeIndex}
                    dataIndex={globalIndex}
                    onSelect={handleSelect}
                    onHover={() => setActiveIndex(globalIndex)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">↵</kbd>
            select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CommandItem({
  item,
  isActive,
  dataIndex,
  onSelect,
  onHover,
}: {
  item: CommandItem;
  isActive: boolean;
  dataIndex: number;
  onSelect: (path: string) => void;
  onHover: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      data-index={dataIndex}
      onClick={() => onSelect(item.path)}
      onMouseEnter={onHover}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">{item.label}</span>
        {item.description && (
          <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
        )}
      </div>
      {isActive && (
        <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ↵
        </kbd>
      )}
    </button>
  );
}
