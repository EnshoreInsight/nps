"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#0b6e69", "#f2a93b", "#0b3948", "#ff6b6b", "#8fb9c5"];

export function CategoryChart({
  data,
  height = 320,
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d7e2ea" horizontal={false} />
        <XAxis type="number" stroke="#53727d" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#53727d"
          width={110}
          tick={{ fontSize: 12 }}
        />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 10, 10, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
