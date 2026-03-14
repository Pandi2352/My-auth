import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Users,
  UserCheck,
  UserPlus,
  Shield,
  Calendar,
  Download,
  Activity,
  RefreshCcw,
  UserX,
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
  Line,
  Cell,
  PieChart,
  Pie,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { toast } from 'sonner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { PageLoader } from '@/components/ui/PageLoader';
import api from '@/lib/api/client';
import { ANALYTICS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const PERIOD_OPTIONS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

interface Overview {
  users: { total: number; verified: number; unverified: number; deleted: number };
  activity: { active_24h: number; active_7d: number; active_30d: number; active_sessions: number };
  status_breakdown: Array<{ status: string; count: number }>;
  role_distribution: Array<{ role_slug: string; role_name: string; count: number }>;
}

interface ChartPoint {
  date: string;
  new_users: number;
  total_users: number;
}

interface LoginPoint {
  date: string;
  successful: number;
  failed: number;
  total: number;
}

interface RoleDist {
  role_name: string;
  count: number;
}

export default function AnalyticsPage() {
  useDocumentTitle('Platform Analytics');

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loginData, setLoginData] = useState<LoginPoint[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDist[]>([]);
  const [days, setDays] = useState(30);
  const [periodOpen, setPeriodOpen] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, chartRes, loginsRes, rolesRes] = await Promise.all([
        api.get(ANALYTICS.OVERVIEW),
        api.get(ANALYTICS.USERS_CHART, { params: { days } }),
        api.get(ANALYTICS.LOGINS, { params: { days } }),
        api.get(ANALYTICS.ROLES),
      ]);

      setOverview(overviewRes.data.data);
      setChartData(chartRes.data.data.chart || []);
      setLoginData(Array.isArray(loginsRes.data.data) ? loginsRes.data.data : []);
      setRoleDistribution(
        (rolesRes.data.data || []).map((r: any) => ({ role_name: r.role_name, count: r.count })),
      );
    } catch (error) {
      handleApiError(error, 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = () => {
    if (!overview) return;
    const report = {
      generated_at: new Date().toISOString(),
      period_days: days,
      overview,
      user_growth: chartData,
      login_activity: loginData,
      role_distribution: roleDistribution,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading) return <PageLoader />;

  const totalLogins = loginData.reduce((s, d) => s + d.total, 0);
  const failedLogins = loginData.reduce((s, d) => s + d.failed, 0);

  // Format chart dates to short format
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform metrics and user insights</p>
        </div>
        <div className="flex gap-2">
          {/* Period selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setPeriodOpen(!periodOpen)}
            >
              <Calendar className="h-4 w-4" />
              {PERIOD_OPTIONS.find((p) => p.days === days)?.label}
            </Button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-md border border-border bg-background shadow-lg py-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => {
                      setDays(opt.days);
                      setPeriodOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                      days === opt.days ? 'font-medium text-primary' : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} title="Refresh">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={overview?.users.total ?? 0}
          subtitle={`${overview?.users.verified ?? 0} verified`}
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <StatsCard
          title="Active (30d)"
          value={overview?.activity.active_30d ?? 0}
          subtitle={`${overview?.activity.active_sessions ?? 0} sessions now`}
          icon={<UserCheck className="h-5 w-5" />}
          color="green"
        />
        <StatsCard
          title="Unverified"
          value={overview?.users.unverified ?? 0}
          subtitle={`${overview?.users.deleted ?? 0} deleted`}
          icon={<UserX className="h-5 w-5" />}
          color="amber"
        />
        <StatsCard
          title="Total Logins"
          value={totalLogins}
          subtitle={`${failedLogins} failed attempts`}
          icon={<MonitorSmartphone className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              User Growth
            </CardTitle>
            <CardDescription>New registrations and cumulative user count</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyChart message="No registration data for this period" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorNew)"
                      name="New Users"
                    />
                    <Line
                      type="monotone"
                      dataKey="total_users"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Total Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Role Distribution
            </CardTitle>
            <CardDescription>Users assigned per role</CardDescription>
          </CardHeader>
          <CardContent>
            {roleDistribution.length === 0 ? (
              <EmptyChart message="No role data available" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="role_name"
                      label={({ name, percent }: any) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {roleDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [value, 'Users']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs capitalize">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Login Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Login Activity
          </CardTitle>
          <CardDescription>
            Successful vs failed login attempts per day ({days}-day view)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginData.length === 0 ? (
            <EmptyChart message="No login data for this period" />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginData} barGap={2}>
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
                      fontSize: '12px',
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Legend
                    verticalAlign="top"
                    height={30}
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                  <Bar
                    dataKey="successful"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    name="Successful"
                    barSize={days > 30 ? 8 : 20}
                  />
                  <Bar
                    dataKey="failed"
                    fill="#ef4444"
                    radius={[3, 3, 0, 0]}
                    name="Failed"
                    barSize={days > 30 ? 8 : 20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      {overview?.status_breakdown && overview.status_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              User Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overview.status_breakdown.map((s) => {
                const colorMap: Record<string, string> = {
                  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                  locked: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                };
                return (
                  <div
                    key={s.status}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${colorMap[s.status] || colorMap.inactive}`}>
                      {s.status}
                    </span>
                    <span className="text-xl font-bold text-foreground">{s.count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Stats Card ──────────────────────────────────────────────
function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const bgMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-lg ${bgMap[color]}`}>{icon}</div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-foreground">{value.toLocaleString()}</h3>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty Chart Placeholder ─────────────────────────────────
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <div className="text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
