import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { LogOut, User, ChevronDown, Sun, Moon, Search, Settings, ShieldCheck, UserCog, X, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { NotificationBell } from '@/components/ui/NotificationBell';

import { useSidebar } from '@/contexts/SidebarContext';

export function Topbar() {
  const { collapsed: sidebarCollapsed, toggle: onToggle } = useSidebar();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Impersonation state
  const impersonatingUser = (() => {
    try {
      const data = localStorage.getItem('impersonating_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  })();

  const handleStopImpersonation = () => {
    const originalAccess = localStorage.getItem('impersonate_original_access');
    const originalRefresh = localStorage.getItem('impersonate_original_refresh');

    if (originalAccess) {
      localStorage.setItem('access_token', originalAccess);
    }
    if (originalRefresh) {
      localStorage.setItem('refresh_token', originalRefresh);
    }

    localStorage.removeItem('impersonate_original_access');
    localStorage.removeItem('impersonate_original_refresh');
    localStorage.removeItem('impersonating_user');

    toast.success('Impersonation ended');
    window.location.href = '/dashboard';
  };

  return (
    <>
      {/* Impersonation Banner */}
      {impersonatingUser && (
        <div
          className={cn(
            'fixed top-0 right-0 z-30 flex h-10 items-center justify-center gap-3 bg-amber-500 text-white text-sm font-medium transition-[left] duration-100 ease-linear',
            sidebarCollapsed ? 'left-16' : 'left-64',
          )}
        >
          <UserCog className="h-4 w-4" />
          <span>
            Impersonating <strong>{impersonatingUser.first_name} {impersonatingUser.last_name}</strong> ({impersonatingUser.email})
          </span>
          <button
            onClick={handleStopImpersonation}
            className="ml-2 flex items-center gap-1 rounded bg-amber-600 px-2 py-0.5 text-xs font-bold hover:bg-amber-700 transition-colors"
          >
            <X className="h-3 w-3" />
            Stop
          </button>
        </div>
      )}

    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-20 flex h-14 items-center justify-between border-b border-border bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md transition-all duration-100 ease-linear',
        impersonatingUser && 'top-10',
      )}
    >
      {/* Container wrapper for content tracking the sidebar */}
      <div
        className={cn(
          'flex h-full w-full items-center justify-between transition-[padding-left] duration-100 ease-linear',
          sidebarCollapsed ? 'pl-16' : 'pl-64',
        )}
      >
        {/* Left: Toggle & Breadcrumbs */}
        <div className="flex items-center pl-2">
          <button
            onClick={onToggle}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4.5 w-4.5" />
            ) : (
              <PanelLeftClose className="h-4.5 w-4.5" />
            )}
          </button>
          <div className="ml-2">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 pr-3">
        {/* Search trigger */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mr-1"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-1 rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-border mx-1" />

        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user?.firstName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-foreground leading-tight">
                {user?.firstName ?? 'User'} {user?.lastName?.[0] ? `${user.lastName[0]}.` : ''}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[100px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-background py-1 shadow-lg">
              {/* User info header */}
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { navigate('/profile'); setOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profile
                </button>
                <button
                  onClick={() => { navigate('/security'); setOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  Security
                </button>
                <button
                  onClick={() => { navigate('/settings'); setOpen(false); }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </button>
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
  </>
);
}

function ThemeToggle() {
  const { toggle, theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
