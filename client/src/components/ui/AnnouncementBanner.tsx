import { useState, useEffect } from 'react';
import { X, Megaphone, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import api from '@/lib/api/client';
import { SETTINGS } from '@/lib/api/endpoints';

interface Announcement {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  dismissible: boolean;
}

const STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-600',
    text: 'text-white',
    icon: <Info className="h-4 w-4" />,
  },
  warning: {
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  success: {
    bg: 'bg-green-600',
    text: 'text-white',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  error: {
    bg: 'bg-red-600',
    text: 'text-white',
    icon: <Megaphone className="h-4 w-4" />,
  },
};

const DISMISS_KEY = 'announcement_dismissed';

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed this announcement
    const dismissedMsg = sessionStorage.getItem(DISMISS_KEY);

    api.get(SETTINGS.LIST)
      .then((res) => {
        const settings = Array.isArray(res.data.data) ? res.data.data : [];
        const toMap = (arr: any[]) => arr.reduce((m: any, s: any) => ({ ...m, [s.key]: s.value }), {});
        const values = toMap(settings);

        const enabled = values['app.announcement_enabled'];
        const message = values['app.announcement_message'];

        if (enabled && message) {
          if (dismissedMsg === message) {
            setDismissed(true);
            return;
          }
          setAnnouncement({
            enabled: true,
            message,
            type: values['app.announcement_type'] || 'info',
            dismissible: values['app.announcement_dismissible'] ?? true,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed) return null;

  const style = STYLES[announcement.type] || STYLES.info;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, announcement.message);
    setDismissed(true);
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium', style.bg, style.text)}>
      {style.icon}
      <span>{announcement.message}</span>
      {announcement.dismissible && (
        <button onClick={handleDismiss} className="ml-2 rounded p-0.5 hover:bg-white/20 transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
