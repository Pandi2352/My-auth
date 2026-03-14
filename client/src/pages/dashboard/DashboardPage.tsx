import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  ScrollText,
  Activity,
  RefreshCcw,
  UserCheck,
  MonitorSmartphone,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Line,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/PageLoader';
import api from '@/lib/api/client';
import { ANALYTICS, AUDIT } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import type { AuditLog } from '@/types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Overview {
  users: { total: number; verified: number; unverified: number; deleted: number };
  activity: { active_24h: number; active_7d: number; active_30d: number; active_sessions: number };
  role_distribution: Array<{ role_slug: string; role_name: string; count: number }>;
}

interface ChartPoint {
  date: string;
  new_users: number;
  total_users: number;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<{ name: string; count: number }[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [overRes, chartRes, roleRes, auditRes] = await Promise.all([
        api.get(ANALYTICS.OVERVIEW),
        api.get(ANALYTICS.USERS_CHART, { params: { days: 7 } }),
        api.get(ANALYTICS.ROLES),
        api.get(AUDIT.LIST, { params: { limit: 5 } }),
      ]);

      setOverview(overRes.data.data);
      setChartData(chartRes.data.data.chart || []);
      setRoleDistribution(
        (roleRes.data.data || []).map((r: any) => ({ name: r.role_name, count: r.count })),
      );
      setRecentLogs(auditRes.data.data.items || []);
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) return <PageLoader />;

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const stats = [
    {
      label: 'Total Users',
      value: overview?.users.total ?? 0,
      subtitle: `${overview?.users.verified ?? 0} verified`,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Active (30d)',
      value: overview?.activity.active_30d ?? 0,
      subtitle: `${overview?.activity.active_24h ?? 0} in last 24h`,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Active Sessions',
      value: overview?.activity.active_sessions ?? 0,
      subtitle: 'Currently online',
      icon: MonitorSmartphone,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'System Roles',
      value: overview?.role_distribution.length ?? 0,
      subtitle: `${overview?.users.unverified ?? 0} unverified users`,
      icon: Shield,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Registrations over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No registration data yet
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatDate}
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
                        fontSize: '12px',
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="new_users"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#dashGradient)"
                      name="New Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="total_users"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Users per role</CardDescription>
          </CardHeader>
          <CardContent>
            {roleDistribution.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No role data yet
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleDistribution} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fontWeight: 500 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                      {roleDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <ActivityFeed initialLogs={recentLogs} />
    </div>
  );
}

// ── Live Activity Feed with auto-refresh ────────────────────
function ActivityFeed({ initialLogs }: { initialLogs: AuditLog[] }) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Poll for new logs every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(AUDIT.LIST, { params: { limit: 8 } });
        setLogs(res.data.data.items || []);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Sync with parent on initial load
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const getMethodColor = (method: string) => {
    const m = method?.toUpperCase();
    if (m === 'POST') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (m === 'PATCH' || m === 'PUT') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (m === 'DELETE') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Activity
            {autoRefresh && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {autoRefresh ? 'Auto-refreshing every 30s' : 'Auto-refresh paused'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/audit-logs')}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <ScrollText className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border">
            {logs.map((log) => (
              <div key={log._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${getMethodColor(log.method)}`}>
                  {log.method}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {log.action?.replace(/:/g, ' ') || log.endpoint}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {log.user_email} &middot; {log.endpoint}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
