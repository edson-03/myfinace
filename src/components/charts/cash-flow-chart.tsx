"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatBRL } from "@/lib/date";

export function CashFlowChart({ data }: { data: { date: string; saldo: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        Sem movimentações neste mês
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={56}
          tickFormatter={(v) => `R$${Number(v).toLocaleString("pt-BR")}`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--foreground)" }}
          formatter={(value) => [formatBRL(Number(value)), "Saldo acumulado"]}
        />
        <Area type="monotone" dataKey="saldo" stroke="var(--primary)" strokeWidth={2} fill="url(#saldoGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
