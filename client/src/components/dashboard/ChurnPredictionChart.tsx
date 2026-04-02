import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendingDown, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import api from '@/lib/api/client';
import { ANALYTICS } from '@/lib/api/endpoints';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';

export function ChurnPredictionChart() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(ANALYTICS.CHURN_PREDICTION)
      .then(res => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-[400px] w-full rounded-lg" />;
  if (!data || data.prediction === 'insufficient_data') return null;

  const isPositive = data.trend === 'increasing';
  const isHighRisk = data.churn_risk === 'high';

  return (
    <Card className="border shadow-none bg-white">
      <CardHeader className="py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
          <Activity className="h-4 w-4 text-violet-500" />
          User Retention Dynamics
        </CardTitle>
        <div className={cn(
          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
          isHighRisk ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"
        )}>
          {data.churn_risk} Risk
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-end gap-3 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Activity Velocity</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 leading-none">
                {Math.round(data.forecast_7d)}
              </span>
              <div className={cn(
                "flex items-center text-[10px] font-bold uppercase",
                isPositive ? "text-emerald-500" : "text-rose-500"
              )}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(data.slope * 100).toFixed(1)}% / wk
              </div>
            </div>
          </div>
          <div className="h-full border-l border-slate-100 pl-3">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Trend</p>
             <p className="text-[11px] font-bold text-slate-900 mt-1 uppercase">{data.trend}</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.full_forecast}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
               <XAxis 
                 dataKey="day" 
                 fontSize={10} 
                 fontWeight={600} 
                 tickLine={false} 
                 axisLine={false} 
                 stroke="#94a3b8" 
                 label={{ value: 'Forecast Days', position: 'insideBottom', offset: -5, fontSize: 9, fontWeight: 700 }}
               />
               <YAxis fontSize={10} fontWeight={600} tickLine={false} axisLine={false} stroke="#94a3b8" />
               <Tooltip 
                 contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '11px' }}
                 labelStyle={{ fontWeight: 700, color: '#1e293b' }}
               />
               <Line 
                 type="monotone" 
                 dataKey="predicted_active" 
                 stroke={isPositive ? "#10b981" : "#ef4444"} 
                 strokeWidth={2} 
                 strokeDasharray="5 5"
                 dot={{ r: 4, fill: isPositive ? "#10b981" : "#ef4444", strokeWidth: 0 }}
                 name="Forecast (Active Users)" 
               />
               <ReferenceLine y={data.current_active} stroke="#f1f5f9" strokeWidth={2} label={{ position: 'right', value: 'Base', fontSize: 10, fill: '#94a3b8' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {isHighRisk && (
           <div className="mt-4 p-3 rounded-lg border border-rose-100 bg-rose-50/50 flex gap-3 animate-in fade-in duration-700">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <p className="text-[10px] leading-relaxed text-rose-700">
                <span className="font-bold uppercase tracking-wider block mb-0.5">Performance Alert</span>
                High abandonment probability detected. Predictive models suggest a decreasing trend in active user density over the next 7-cycle window.
              </p>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
