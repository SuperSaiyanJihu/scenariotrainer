import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-soft transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
