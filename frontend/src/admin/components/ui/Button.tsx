/**
 * Admin Button.
 *
 * A small variant/size system using the xQuesty indigo accent. Kept local to the
 * admin module (so admin styling can evolve independently) but built on the
 * shared `cn` utility. Supports a `loading` state with an inline spinner.
 */
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover shadow-sm",
  secondary: "bg-gray-100 dark:bg-surface-2 text-gray-900 dark:text-ink hover:bg-gray-200 dark:hover:bg-surface-2",
  outline: "border border-gray-300 dark:border-border-brand bg-white dark:bg-card text-gray-700 dark:text-ink hover:bg-gray-50 dark:hover:bg-surface-2",
  ghost: "text-gray-600 dark:text-ink hover:bg-gray-100 dark:hover:bg-surface-2 hover:text-gray-900",
  destructive: "bg-danger text-danger-foreground hover:opacity-90 shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-sm gap-2",
  icon: "h-9 w-9",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "AdminButton";
