/** Form primitives: Label, Input, Textarea, Select, Field wrapper. */
import React from "react";
import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-lg border border-gray-300 dark:border-border-brand bg-white dark:bg-surface px-3 py-2 text-sm text-gray-900 dark:text-ink " +
  "placeholder:text-gray-400 dark:placeholder:text-[hsl(var(--text-muted))] transition-colors focus:border-transparent focus:outline-none " +
  "focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-surface-2";

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("mb-1.5 block text-sm font-medium text-gray-700 dark:text-ink", className)} {...props} />
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, className)} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseField, "min-h-[90px] resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(baseField, "cursor-pointer pr-8", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

/** Label + control + optional hint/error, vertically stacked. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
