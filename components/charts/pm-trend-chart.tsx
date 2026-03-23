"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PmTrendChart({
  data,
  height = 300,
}: {
  data: Array<{ label: string; submissions: number }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="label" stroke="#53727d" />
        <YAxis stroke="#53727d" />
        <Tooltip />
        <Line type="monotone" dataKey="submissions" stroke="#0b6e69" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
