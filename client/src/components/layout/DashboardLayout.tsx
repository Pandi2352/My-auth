import { useCallback, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageLoader } from '@/components/ui/PageLoader';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { IdleTimeoutWarning } from '@/components/ui/IdleTimeoutWarning';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';
import { cn } from '@/lib/utils/cn';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useAuthStore } from '@/stores/authStore';

import { useSidebar } from '@/contexts/SidebarContext';

function SkeletonContent() {
  const { pathname } = useLocation();
  if (pathname.includes('/users') || pathname.includes('/roles') || pathname.includes('/groups')) {
    return <TableSkeleton />;
  }
  return <PageLoader />;
}

export function DashboardLayout() {
  const { collapsed } = useSidebar();
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleIdleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const { showWarning, countdown, stayActive } = useIdleTimeout({
    timeout: 15 * 60 * 1000,     // 15 minutes idle
    warningDuration: 60 * 1000,  // 60 second countdown
    onLogout: handleIdleLogout,
  });

  return (
    <div className="min-h-screen bg-background text-[13.5px]">
      <Sidebar />
      <Topbar />

      <main
        className={cn(
          'transition-[padding-left] duration-100 ease-linear',
          collapsed ? 'pl-16' : 'pl-64',
          localStorage.getItem('impersonating_user') ? 'pt-[96px]' : 'pt-14',
        )}
      >
        <AnnouncementBanner />
        <div className="px-4 pt-4 min-h-[calc(100vh-theme('spacing.14'))] flex flex-col">
          <Suspense fallback={<SkeletonContent />}>
            <Outlet />
          </Suspense>
          
          <footer className="mt-auto py-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-t border-slate-100/60 transition-[margin] duration-100 ease-linear">
            <div>
              &copy; {new Date().getFullYear()} Engineering Excellence.
            </div>
            <div className="flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-slate-800 tracking-tight">Commit ID: </span>
               <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                 {__GIT_COMMIT_ID__}
               </span>
            </div>
          </footer>
        </div>
      </main>

      <IdleTimeoutWarning
        open={showWarning}
        countdown={countdown}
        onStayActive={stayActive}
        onLogout={handleIdleLogout}
      />

      <CommandPalette />
    </div>
  );
}
