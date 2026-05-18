'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getMonthName } from '@/lib/utils';

interface MonthData {
  month: number;
  issued: number;
  received: number;
  expenses: number;
  netProfit: number;
}

interface Props {
  data: MonthData[];
  year: number;
}

export default function StatisticsChart({ data, year }: Props) {
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const found = data.find(d => d.month === i);
    return {
      name: getMonthName(i),
      'Išrašytos': found?.issued ?? 0,
      'Gauti': found?.received ?? 0,
      'Grynasis': found?.netProfit ?? 0,
    };
  });

  const formatY = (v: number) => v === 0 ? '0.00 €' : `${(v / 1000).toFixed(0)} 000 €`;

  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatY}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          formatter={(value, name) => [`${Number(value).toFixed(2)} €`, name]}
          contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          formatter={(value) => (
            <span style={{ color: '#6b7280' }}>{value}</span>
          )}
        />
        <Bar dataKey="Išrašytos" fill="#86efac" radius={[4, 4, 0, 0]} opacity={0.7} />
        <Bar dataKey="Gauti" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Line
          type="monotone"
          dataKey="Grynasis"
          stroke="#1a1a2e"
          strokeWidth={2}
          dot={{ r: 3, fill: '#1a1a2e', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
