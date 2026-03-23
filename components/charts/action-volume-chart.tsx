"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ActionVolumeChart({
  data,
  height = 260,
}: {
  data: Array<{ label: string; opened: number; closed: number; backlog: number }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d7e2ea" vertical={false} />
        <XAxis dataKey="label" stroke="#53727d" />
        <YAxis yAxisId="backlog" stroke="#53727d" allowDecimals={false} />
        <YAxis yAxisId="flow" orientation="right" stroke="#53727d" allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Area
          yAxisId="backlog"
          type="monotone"
          dataKey="backlog"
          name="Open backlog"
          stroke="#78b9c8"
          fill="#cbe7ef"
          fillOpacity={1}
          strokeWidth={1.5}
        />
        <Line
          yAxisId="flow"
          type="monotone"
          dataKey="opened"
          name="Opened"
          stroke="#0b6e69"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="flow"
          type="monotone"
          dataKey="closed"
          name="Closed"
          stroke="#f2a93b"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
