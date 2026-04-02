import { useState, useEffect } from 'react';
import {
  Users,
  Server,
  Activity,
  RefreshCcw,
  UserCheck,
  MonitorSmartphone,
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Zap,
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
  Cell,
  PieChart,
  Pie,
  Line,
  ComposedChart,
  LineChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardSkeleton, Skeleton } from '@/components/ui/Skeleton';
import api from '@/lib/api/client';
import { ANALYTICS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/handleError';
import { cn } from '@/lib/utils/cn';
import { LiveActivityFeed } from '@/components/dashboard/LiveActivityFeed';
import { ChurnPredictionChart } from '@/components/dashboard/ChurnPredictionChart';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [overRes, chartRes, roleRes] = await Promise.all([
        api.get(ANALYTICS.OVERVIEW),
        api.get(ANALYTICS.USERS_CHART, { params: { days: 7 } }),
        api.get(ANALYTICS.ROLES),
      ]);
      setOverview(overRes.data.data);
      setChartData(chartRes.data.data.chart || []);
      setRoleDistribution((roleRes.data.data || []).map((r: any) => ({ name: r.role_name, count: r.count })));
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const stats = [
    { label: 'Total Users', value: overview?.users.total ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50/50', border: 'border-blue-100' },
    { label: 'Active (30d)', value: overview?.activity.active_30d ?? 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
    { label: 'Sessions', value: overview?.activity.active_sessions ?? 0, icon: MonitorSmartphone, color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { label: 'Alerts', value: 12, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
  ];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Platform Analytics</h1>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">System-wide monitoring dashboard</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData} 
          disabled={isLoading}
          className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
        >
          <RefreshCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          <span className="text-[10px] font-bold uppercase">
             {isLoading ? 'Processing...' : 'Sync Metrics'}
          </span>
        </Button>
      </div>

      {/* COMPACT FLAT STATS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading 
          ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card key={stat.label} className={cn("border bg-white shadow-none transition-all duration-300", stat.border)}>
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", stat.bg, stat.border)}>
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-xl font-bold text-slate-900 leading-none mt-1">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        }
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* GROWTH CHART */}
        <Card className="lg:col-span-2 border shadow-none bg-white">
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Growth Dynamics (Daily vs Cumulative)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[240px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-700">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={formatDate} stroke="#94a3b8" />
                    <YAxis fontSize={10} fontWeight={600} tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px' }}
                      labelStyle={{ fontWeight: 700, color: '#1e293b' }}
                    />
                    <Bar dataKey="new_users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="New (Daily)" />
                    <Area type="monotone" dataKey="total_users" stroke="#8b5cf6" fill="#8b5cf610" strokeWidth={2} name="Total (Cumulative)" />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            {!isLoading && (
              <div className="mt-2 flex justify-center gap-4 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1 duration-500 delay-300">
                 <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-500" /> New Users</div>
                 <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-violet-500" /> Active Base</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROLE ALLOCATION */}
        <Card className="border shadow-none bg-white">
          <CardHeader className="py-3 px-4 border-b border-slate-100">
             <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                <PieIcon className="h-4 w-4 text-emerald-500" />
                Access Allocation
             </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
             <div className="h-[180px]">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%" className="animate-in zoom-in duration-500">
                     <PieChart>
                        <Pie data={roleDistribution} dataKey="count" cx="50%" cy="50%" innerRadius={55} outerRadius={70} stroke="#fff" strokeWidth={2}>
                           {roleDistribution.map((_, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
                )}
             </div>
             <div className="mt-4 space-y-1.5">
                {isLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                ) : (
                  roleDistribution.slice(0, 4).map((r, i) => (
                    <div key={r.name} className="flex items-center justify-between text-[10px] font-bold uppercase p-2 border border-slate-50 rounded-lg animate-in slide-in-from-left-2 duration-300">
                       <span className="flex items-center gap-2 text-slate-500">
                         <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                         {r.name}
                       </span>
                       <span className="text-slate-900">{r.count}</span>
                    </div>
                  ))
                )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* METRIC SPARK BOXES */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
         {[
           { label: 'Peak Latency', value: '42ms', icon: Zap, color: 'text-emerald-600', mColor: 'text-emerald-500', barCol: '#10b981', type: 'bar' },
           { label: 'Cluster Load', value: '12.2%', icon: Server, color: 'text-blue-600', mColor: 'text-blue-500', barCol: '#3b82f6', type: 'area' },
           { label: 'API Traffic', value: '2.1k / m', icon: Activity, color: 'text-indigo-600', mColor: 'text-indigo-500', barCol: '#6366f1', type: 'line' }
         ].map((metric) => (
           <Card key={metric.label} className="border shadow-none bg-white">
             <CardContent className="p-4">
               {isLoading ? (
                 <div className="space-y-4">
                   <div className="flex justify-between"><Skeleton className="h-10 w-24" /><Skeleton className="h-4 w-4" /></div>
                   <Skeleton className="h-[50px] w-full" />
                 </div>
               ) : (
                 <>
                   <div className="flex justify-between items-center mb-3">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{metric.label}</p>
                        <p className={cn("text-xl font-bold mt-1 animate-in slide-in-from-bottom-1 duration-300", metric.color)}>{metric.value}</p>
                     </div>
                     <metric.icon className={cn("h-4 w-4", metric.mColor)} />
                   </div>
                   <div className="h-[50px] animate-in fade-in duration-700">
                      <ResponsiveContainer width="100%" height="100%">
                         {metric.type === 'bar' ? (
                           <BarChart data={chartData.slice(-10).map(() => ({ v: 40 + Math.random() * 60 }))}>
                              <Bar dataKey="v" fill={metric.barCol} radius={[2, 2, 0, 0]} />
                           </BarChart>
                         ) : metric.type === 'area' ? (
                           <AreaChart data={chartData.slice(-10).map(() => ({ v: 10 + Math.random() * 15 }))}>
                              <Area type="monotone" dataKey="v" stroke={metric.barCol} fill={`${metric.barCol}08`} strokeWidth={2} />
                           </AreaChart>
                         ) : (
                           <LineChart data={chartData.slice(-10).map(() => ({ v: 100 + Math.random() * 200 }))}>
                              <Line type="monotone" dataKey="v" stroke={metric.barCol} strokeWidth={2} dot={false} />
                           </LineChart>
                         )}
                      </ResponsiveContainer>
                   </div>
                 </>
               )}
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
         {/* REAL-TIME FEED */}
         <div className="lg:col-span-1">
            <LiveActivityFeed />
         </div>

         {/* PREDICTIVE CHURN MODEL */}
         <div className="lg:col-span-1">
            <ChurnPredictionChart />
         </div>

         {/* INFRASTRUCTURE MONITOR: CLEAN WHITE */}
         <Card className="lg:col-span-1 border shadow-none bg-white flex flex-col">
            <CardHeader className="py-3 px-4 border-b border-slate-100 flex-row items-center justify-between flex-shrink-0">
               <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                 <BarChart3 className="h-4 w-4 text-indigo-500" />
                 Cluster Nodes
               </CardTitle>
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-grow h-[315px]">
               <div className="divide-y divide-slate-100">
                  {[
                    { name: 'Core API Hub', pool: 'prod-01', load: 12 },
                    { name: 'Audit Storage', pool: 'db-clust', load: 45 },
                    { name: 'Worker Group', pool: 'compute', load: 88 }
                  ].map((svc) => (
                    <div key={svc.name} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors">
                       <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{svc.name}</span>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{svc.pool}</p>
                       </div>
                       <div className="text-right flex items-center gap-4">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className={cn("h-full", svc.load > 80 ? 'bg-rose-500' : 'bg-emerald-500')} style={{ width: `${svc.load}%` }} />
                          </div>
                          <span className={cn("text-[10px] font-bold w-10 text-right", svc.load > 80 ? 'text-rose-600' : 'text-slate-600')}>{svc.load}%</span>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
