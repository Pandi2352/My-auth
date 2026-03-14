import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { IdleTimeoutWarning } from '@/components/ui/IdleTimeoutWarning';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { AnnouncementBanner } from '@/components/ui/AnnouncementBanner';
import { cn } from '@/lib/utils/cn';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { useAuthStore } from '@/stores/authStore';

export function DashboardLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [collapsed, setCollapsed] = useState(isMobile);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

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
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar sidebarCollapsed={collapsed} />

      <main
        className={cn(
          'transition-all duration-200',
          collapsed ? 'pl-16' : 'pl-60',
          localStorage.getItem('impersonating_user') ? 'pt-[104px]' : 'pt-16',
        )}
      >
        <AnnouncementBanner />
        <div className="p-6">
          <Outlet />
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
