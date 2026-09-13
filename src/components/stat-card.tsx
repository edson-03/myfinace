import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type Tone = "primary" | "success" | "danger" | "warning" | "neutral";

const TONE_STYLES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warning: "bg-warning-bg text-warning",
  neutral: "bg-surface-hover text-muted-foreground",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>
        {Icon && (
          <div className={cn("flex size-8 items-center justify-center rounded-lg", TONE_STYLES[tone])}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
