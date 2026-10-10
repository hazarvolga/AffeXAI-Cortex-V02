import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SubscriberGrowth } from '@/lib/api/analyticsService';
import { Users, UserPlus, UserMinus, Activity } from 'lucide-react';
import { BccHudTile } from '@/components/brand/BccHudTile';

interface SubscriberGrowthChartProps {
  data: SubscriberGrowth[];
  showDetails?: boolean;
}

export default function SubscriberGrowthChart({ data, showDetails = false }: SubscriberGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/20 font-mono uppercase tracking-widest text-[10px]">
        <div className="text-center">
          <Users className="h-8 w-8 mx-auto mb-4 opacity-10" />
          <p>DATA_STREAM_NULL</p>
        </div>
      </div>
    );
  }

  const latestData = data[data.length - 1];

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
    total: item.totalSubscribers,
    new: item.newSubscribers,
    loss: item.unsubscribes,
  }));

  return (
    <div className="space-y-8 w-full">
      {/* HUD Metrics Integration */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-white/40 text-[9px] tracking-widest mb-1">
            <Users className="h-3 w-3" /> TOTAL_NODES
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            {formatNumber(latestData?.totalSubscribers || 0)}
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-[#9df425]/40 text-[9px] tracking-widest mb-1">
            <UserPlus className="h-3 w-3" /> INBOUND_RECRUITS
          </div>
          <div className="text-xl font-bold text-[#9df425] tabular-nums">
            {formatNumber(latestData?.newSubscribers || 0)}
          </div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-red-500/40 text-[9px] tracking-widest mb-1">
            <UserMinus className="h-3 w-3" /> NODE_ATTRITION
          </div>
          <div className="text-xl font-bold text-red-500/80 tabular-nums">
            {formatNumber(latestData?.unsubscribes || 0)}
          </div>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="h-[300px] w-full border border-white/5 bg-white/[0.01] p-4 relative overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-[#9df425] animate-pulse rounded-full" />
          <span className="text-[9px] font-mono font-bold text-white/60 tracking-[0.2em] uppercase">REGISTRY_PROPAGATION_PULSE</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9df425" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#9df425" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val}
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
              itemStyle={{ color: '#9df425' }}
              labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}
              cursor={{ stroke: 'rgba(157, 244, 37, 0.2)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#9df425"
              fillOpacity={1}
              fill="url(#colorTotal)"
              strokeWidth={1.5}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
            <h4 className="text-[9px] text-white/40 tracking-widest mb-1">NET_GAIN</h4>
            <p className="text-xl font-bold text-white tabular-nums">{formatNumber(latestData?.netGrowth || 0)}</p>
            <div className="flex items-center gap-1 mt-2">
              <Activity className="h-3 w-3 text-[#9df425]/40" />
              <span className="text-[8px] text-white/20 tracking-widest">REALTIME_INDEX</span>
            </div>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase text-right">
            <h4 className="text-[9px] text-white/40 tracking-widest mb-1">EXPANSION_RATE</h4>
            <p className="text-xl font-bold text-[#9df425] tabular-nums">{latestData?.growthRate.toFixed(2)}%</p>
            <div className="flex items-center justify-end gap-1 mt-2">
              <span className="text-[8px] text-white/20 tracking-widest">ANNULAR_AVERAGE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}