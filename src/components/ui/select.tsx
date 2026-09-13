import { cn } from "@/lib/cn";

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "w-full appearance-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-primary/40 focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
