import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, MousePointerClick } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import api from '@/lib/api/client';
import { NOTIFICATIONS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
  link?: string;
  is_read: boolean;
  created_at: string;
  action_type?: string;
  is_action_taken?: boolean;
  action_result?: string;
}

const TYPE_STYLES: Record<string, { icon: React.ReactNode; bg: string }> = {
  info: { icon: <Info className="h-4 w-4" />, bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' },
  success: { icon: <CheckCircle className="h-4 w-4" />, bg: 'bg-green-100 text-green-600 dark:bg-green-900/30' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' },
  error: { icon: <XCircle className="h-4 w-4" />, bg: 'bg-red-100 text-red-600 dark:bg-red-900/30' },
  action: { icon: <MousePointerClick className="h-4 w-4" />, bg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' },
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = io(`${API_BASE}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('notification', (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get(NOTIFICATIONS.UNREAD_COUNT);
      setUnreadCount(typeof res.data.data === 'number' ? res.data.data : 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get(NOTIFICATIONS.LIST, { params: { limit: 15 } });
      setNotifications(res.data.data.notifications || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(NOTIFICATIONS.MARK_READ(id));
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch(NOTIFICATIONS.MARK_ALL_READ);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleAction = async (id: string, result: 'approved' | 'rejected') => {
    try {
      await api.patch(NOTIFICATIONS.PERFORM_ACTION(id), null, { params: { result } });
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, is_action_taken: true, action_result: result, is_read: true }
            : n,
        ),
      );
      toast.success(`Request ${result} successfully`);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) handleMarkRead(notif._id);
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
                return (
                  <div
                    key={notif._id}
                    className={cn(
                      'flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors border-b border-border last:border-0 hover:bg-slate-50/50',
                      !notif.is_read && 'bg-primary/5',
                    )}
                  >
                    <div className="flex w-full items-start gap-3 cursor-pointer" onClick={() => handleClick(notif)}>
                      <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', style.bg)}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn('text-xs font-semibold truncate', notif.is_read ? 'text-muted-foreground' : 'text-slate-900')}>
                            {notif.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-muted-foreground ml-2 font-bold uppercase">
                            {formatTime(notif.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 font-medium leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>

                    {/* ACTION CENTER CONTROLS */}
                    {notif.type === 'action' && (
                      <div className="ml-11 mt-1 flex items-center gap-2">
                        {notif.is_action_taken ? (
                          <div className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider",
                            notif.action_result === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {notif.action_result === 'approved' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Request {notif.action_result}
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAction(notif._id, 'approved'); }}
                              className="px-3 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAction(notif._id, 'rejected'); }}
                              className="px-3 py-1 rounded border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
