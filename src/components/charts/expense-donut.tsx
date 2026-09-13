"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatBRL } from "@/lib/date";

const COLORS = ["#4f46e5", "#059669", "#d97706", "#e11d48", "#7c3aed", "#0ea5e9", "#a1a1aa"];

export function ExpenseDonut({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        Sem despesas neste mês
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, name) => [formatBRL(Number(value)), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-2">
        {data.map((item, i) => (
          <li key={item.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-foreground">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="shrink-0 font-medium text-muted-foreground">{formatBRL(item.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
