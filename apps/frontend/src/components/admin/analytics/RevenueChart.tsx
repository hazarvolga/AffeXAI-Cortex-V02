import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { RevenueMetrics } from '@/lib/api/analyticsService';
import { DollarSign, TrendingUp, Target, Activity } from 'lucide-react';

interface RevenueChartProps {
  data: RevenueMetrics[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/20 font-mono uppercase tracking-widest text-[10px]">
        <div className="text-center">
          <DollarSign className="h-8 w-8 mx-auto mb-4 opacity-10" />
          <p>YIELD_STREAM_NULL</p>
        </div>
      </div>
    );
  }

  const latestData = data[data.length - 1];

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    });
  };

  const chartData = data.map(item => ({
    name: formatDate(item.date).toUpperCase(),
    revenue: item.revenue,
    conversions: item.conversions,
  }));

  return (
    <div className="space-y-8 w-full">
      {/* Yield Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-[#ff8c00]/40 text-[9px] tracking-widest mb-1">
            <DollarSign className="h-3 w-3" /> TOTAL_EQUITY_FLOW
          </div>
          <div className="text-xl font-bold text-[#ff8c00] tabular-nums">
            {formatCurrency(latestData?.revenue || 0)}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[8px] text-white/20">
            <TrendingUp className="h-2.5 w-2.5 text-[#9df425]/40" /> SIGNAL_OPTIMIZED
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-white/40 text-[9px] tracking-widest mb-1">
            <Target className="h-3 w-3" /> NODE_CONVERSIONS
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            {formatNumber(latestData?.conversions || 0)}
          </div>
          <div className="text-[8px] text-white/20 mt-1">RATE: {(latestData?.conversionRate || 0).toFixed(2)}%</div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-[#9df425]/40 text-[9px] tracking-widest mb-1">
            <Activity className="h-3 w-3" /> MEAN_ORDER_VALUE
          </div>
          <div className="text-xl font-bold text-[#9df425] tabular-nums">
            {formatCurrency(latestData?.averageOrderValue || 0)}
          </div>
          <div className="text-[8px] text-white/20 mt-1">YIELD/SIGNAL: {formatCurrency(latestData?.revenuePerEmail || 0)}</div>
        </div>
      </div>

      {/* Yield Trajectory */}
      <div className="h-[300px] w-full border border-white/5 bg-white/[0.01] p-4 relative overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-[#9df425] animate-pulse rounded-full" />
          <span className="text-[9px] font-mono font-bold text-white/60 tracking-[0.2em] uppercase">EQUITY_PROPAGATION_TRAJECTORY</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.1)"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.1)"
              fontSize={8}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}
              tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0px',
                fontSize: '10px',
                fontFamily: 'monospace',
                textTransform: 'uppercase'
              }}
              itemStyle={{ color: '#ff8c00' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
            />
            <Legend
              wrapperStyle={{
                fontSize: '8px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                paddingTop: '20px',
                opacity: 0.4
              }}
            />
            <Bar
              dataKey="revenue"
              name="EQUITY_YIELD"
              fill="#ff8c00"
              opacity={0.6}
              radius={[0, 0, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              name="CONVERSION_SIGNAL"
              stroke="#9df425"
              strokeWidth={2}
              dot={{ r: 2, fill: '#9df425', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}