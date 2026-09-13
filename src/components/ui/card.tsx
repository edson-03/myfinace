import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
