'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/loading/skeleton';

// Lazy load Recharts components - they are heavy
export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  }
);

export { XAxis } from 'recharts';

export { YAxis } from 'recharts';

export { Tooltip } from 'recharts';

export { Legend } from 'recharts';

export { Line } from 'recharts';

export { CartesianGrid } from 'recharts';

export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  }
);

export { Bar } from 'recharts';

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  }
);

export { Pie } from 'recharts';

export { Cell } from 'recharts';
