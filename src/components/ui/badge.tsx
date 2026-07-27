import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-brand-50 text-brand-700": variant === "default",
          "bg-zinc-100 text-zinc-600": variant === "secondary",
          "bg-emerald-50 text-emerald-700": variant === "success",
          "bg-amber-50 text-amber-800": variant === "warning",
          "bg-rose-50 text-rose-700": variant === "destructive",
          "border border-zinc-200 text-zinc-600": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
