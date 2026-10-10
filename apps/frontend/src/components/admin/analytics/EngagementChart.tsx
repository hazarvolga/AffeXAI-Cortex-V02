import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { EmailEngagement } from '@/lib/api/analyticsService';
import { Mail, MousePointer, Clock, Activity, Zap } from 'lucide-react';

interface EngagementChartProps {
  data: EmailEngagement[];
  showDetails?: boolean;
}

export default function EngagementChart({ data, showDetails = false }: EngagementChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-white/20 font-mono uppercase tracking-widest text-[10px]">
        <div className="text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 opacity-10" />
          <p>ENGAGEMENT_STREAM_NULL</p>
        </div>
      </div>
    );
  }

  const latestData = data[data.length - 1];
  const averageOpenRate = data.reduce((sum, item) => sum + item.openRate, 0) / data.length;
  const averageClickRate = data.reduce((sum, item) => sum + item.clickRate, 0) / data.length;

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
    });
  };

  const chartData = data.map(item => ({
    name: formatDate(item.date).toUpperCase(),
    open: item.openRate,
    click: item.clickRate,
  }));

  return (
    <div className="space-y-8 w-full">
      {/* Telemetry Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-[#9df425]/40 text-[9px] tracking-widest mb-1">
            <Mail className="h-3 w-3" /> OPEN_RESONANCE_RATE
          </div>
          <div className="text-xl font-bold text-[#9df425] tabular-nums">
            {formatPercentage(latestData?.openRate || 0)}
          </div>
          <div className="text-[8px] text-white/20 mt-1">MEAN: {formatPercentage(averageOpenRate)}</div>
        </div>

        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
          <div className="flex items-center gap-2 text-[#ff8c00]/40 text-[9px] tracking-widest mb-1">
            <MousePointer className="h-3 w-3" /> CLICK_SIGNAL_RATE
          </div>
          <div className="text-xl font-bold text-[#ff8c00] tabular-nums">
            {formatPercentage(latestData?.clickRate || 0)}
          </div>
          <div className="text-[8px] text-white/20 mt-1">MEAN: {formatPercentage(averageClickRate)}</div>
        </div>
      </div>

      {/* Resonance Plot */}
      <div className="h-[300px] w-full border border-white/5 bg-white/[0.01] p-4 relative overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-[#ff8c00] animate-pulse rounded-full" />
          <span className="text-[9px] font-mono font-bold text-white/60 tracking-[0.2em] uppercase">SIGNAL_INTERACTION_TELEMETRY</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
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
              tickFormatter={(val) => `${val}%`}
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
              cursor={{ stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: 1 }}
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
            <Line
              type="monotone"
              dataKey="open"
              name="OPEN_PULSE"
              stroke="#9df425"
              strokeWidth={2}
              dot={{ r: 2, fill: '#9df425', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#9df425', stroke: '#000', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="click"
              name="CLICK_SIGNAL"
              stroke="#ff8c00"
              strokeWidth={2}
              dot={{ r: 2, fill: '#ff8c00', strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#ff8c00', stroke: '#000', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showDetails && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3 w-3 text-[#ff8c00]/60" />
              <h4 className="text-[9px] text-white/40 tracking-widest uppercase">MEAN_TIME_TO_OPEN</h4>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">{latestData?.avgTimeToOpen || 0} MS</p>
            <div className="text-[8px] text-white/20 mt-1 uppercase tracking-widest leading-tight">POST_DISPATCH_LATENCY</div>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/5 font-mono uppercase text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <h4 className="text-[9px] text-white/40 tracking-widest uppercase">MEAN_TIME_TO_ACTION</h4>
              <Clock className="h-3 w-3 text-[#9df425]/60" />
            </div>
            <p className="text-xl font-bold text-[#9df425] tabular-nums">{latestData?.avgTimeToClick || 0} MS</p>
            <div className="text-[8px] text-white/20 mt-1 uppercase tracking-widest leading-tight">POST_OPEN_INTERACTION</div>
          </div>
        </div>
      )}
    </div>
  );
}