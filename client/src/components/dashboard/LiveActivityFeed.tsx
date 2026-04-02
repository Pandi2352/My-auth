import { useAuditSocket } from '@/hooks/useAuditSocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Activity, User, Shield, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';

const ACTION_ICONS: Record<string, any> = {
  'user.create': User,
  'user.delete': User,
  'role.update': Shield,
  'auth.login': Activity,
  'auth.failed': AlertTriangle,
};

export function LiveActivityFeed() {
  const { logs } = useAuditSocket();

  return (
    <Card className="border shadow-none bg-white flex flex-col h-[400px]">
      <CardHeader className="py-3 px-4 border-b border-slate-100 flex-shrink-0">
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center justify-between text-slate-600">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
            Live Activity Feed
          </div>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto custom-sidebar-scrollbar flex-grow">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting live events...</p>
            </div>
          ) : (
            logs.map((log) => {
              const Icon = ACTION_ICONS[log.action] || Info;
              const isAlert = log.status_code && log.status_code >= 400;

              return (
                <div key={log._id} className="p-3 hover:bg-slate-50 transition-colors animate-in slide-in-from-top-1 duration-300">
                  <div className="flex gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border",
                      isAlert ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-slate-50 border-slate-100 text-slate-500"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-bold text-slate-900 truncate">
                          {log.user_email || 'System'}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        <span className="font-bold text-slate-700">{log.action}</span> on {log.target_type}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
