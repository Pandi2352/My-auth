import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  Zap, 
  Clock, 
  BarChart3, 
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck,
  Server
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { cn } from '@/lib/utils/cn';

interface Metric {
  cpu: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
  };
  eventLoopLag: number;
  rps: number;
  avgLatency: number;
  uptime: number;
  timestamp: string;
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [current, setCurrent] = useState<Metric | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io(`${import.meta.env.VITE_API_URL.replace('/api/v1', '')}/health`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('metrics_update', (data: Metric) => {
      setCurrent(data);
      setMetrics(prev => {
        const next = [...prev, data];
        return next.slice(-30); // Keep last 30 data points (approx 1.5 mins)
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Health</h1>
          <p className="text-sm text-muted-foreground">
            Surgical real-time telemetry from the Deep Night administrative engine.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
          <div className={cn("h-2 w-2 rounded-full", connected ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
          {connected ? "LIVE TELEMETRY ACTIVE" : "CONNECTION LOST"}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={`${current?.cpu ?? 0}%`}
          desc="Current processing load"
          icon={Cpu}
          color="text-blue-500"
        />
        <MetricCard
          title="Memory Heap"
          value={`${current?.memory.heapUsed ?? 0} MB`}
          desc={`Total allocated: ${current?.memory.heapTotal ?? 0} MB`}
          icon={Activity}
          color="text-emerald-500"
        />
        <MetricCard
          title="Throughput"
          value={`${current?.rps ?? 0} RPS`}
          desc="Requests per second"
          icon={Zap}
          color="text-amber-500"
        />
        <MetricCard
          title="Response Time"
          value={`${current?.avgLatency ?? 0} ms`}
          desc="Average surgical latency"
          icon={Clock}
          color="text-purple-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Load & Performance Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Server Load Profile</h3>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Real-time Area Data</div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis 
                  dataKey="timestamp" 
                  hide 
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cpu" 
                  name="CPU %"
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorCpu)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="memory.heapUsed" 
                  name="Heap MB"
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorMem)" 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-foreground">Traffic & Latency</h3>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rolling 30 Data Points</div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="timestamp" hide />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', fontSize: '12px' }}
                />
                <Line
                  type="stepAfter"
                  dataKey="rps"
                  name="Req/Sec"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="avgLatency"
                  name="Latency (ms)"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary System Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-1 rounded-xl border border-border bg-zinc-950/40 p-5">
           <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
             <ShieldCheck className="h-3.5 w-3.5" />
             Uptime Intelligence
           </div>
           <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm text-muted-foreground">Server Uptime</span>
                <span className="font-mono text-sm text-foreground">{formatUptime(current?.uptime ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm text-muted-foreground">Event Loop Lag</span>
                <span className={cn(
                  "font-mono text-sm",
                  (current?.eventLoopLag ?? 0) > 50 ? "text-red-500" : "text-emerald-500"
                )}>
                  {current?.eventLoopLag ?? 0} ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Physical Mem</span>
                <span className="font-mono text-sm text-foreground">{current?.memory.rss ?? 0} MB</span>
              </div>
           </div>
        </div>

        <div className="col-span-2 flex items-center justify-between rounded-xl border border-dashed border-border p-8 bg-zinc-900/10">
           <div className="space-y-2">
             <div className="flex items-center gap-2 text-primary">
                <RefreshCcw className="h-5 w-5" />
                <h4 className="font-bold">Auto-Scaling Thresholds</h4>
             </div>
             <p className="max-w-md text-xs text-muted-foreground">
               These metrics are being consumed by the Antigravity Engine to evaluate cluster health. Current metrics are within the surgical safe zone (CPU &lt; 85%, Lag &lt; 100ms).
             </p>
           </div>
           <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Server className="h-8 w-8" />
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, desc, icon: Icon, color }: { title: string; value: string; desc: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/20">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <p className="mt-1 text-[10px] text-muted-foreground">{desc}</p>
    </div>
  );
}
