import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "bg-surface-hover text-foreground hover:bg-border",
  ghost: "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
  danger: "text-danger hover:bg-danger-bg",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
