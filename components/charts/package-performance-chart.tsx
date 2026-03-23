"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PackagePerformanceChart({
  data,
}: {
  data: Array<{ packageName: string; averageScore: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d7e2ea" vertical={false} />
        <XAxis dataKey="packageName" stroke="#53727d" tick={{ fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={60} />
        <YAxis stroke="#53727d" domain={[0, 10]} />
        <Tooltip />
        <Bar dataKey="averageScore" radius={[10, 10, 0, 0]} fill="#0b6e69" />
      </BarChart>
    </ResponsiveContainer>
  );
}
