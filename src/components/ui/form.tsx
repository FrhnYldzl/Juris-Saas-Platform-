import { cn } from "@/lib/utils";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

/**
 * Shared form primitives. Mirrors the Platform.html design language:
 * navy labels (uppercase micro-caps), paper-toned inputs, red focus ring.
 * Use these in every module form for consistency.
 */

export function Field({
  label, error, hint, required, children, className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold text-juris-ink tracking-[0.06em] uppercase">
        {label}
        {required && <span className="text-juris-red ml-0.5">*</span>}
      </span>
      {children}
      {hint && !error && <span className="text-[11px] text-juris-ink-3">{hint}</span>}
      {error && <span className="text-[11px] text-juris-red">{error}</span>}
    </label>
  );
}

const inputClass =
  "h-10 px-3 rounded-md border border-juris-line bg-juris-paper text-sm text-juris-navy " +
  "placeholder:text-juris-ink-4 outline-none transition-all " +
  "hover:border-juris-navy-200 " +
  "focus:border-juris-red focus:bg-white focus:ring-[3px] focus:ring-juris-red/10 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputClass, "h-auto py-2.5 leading-relaxed", props.className)}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, "pr-8 cursor-pointer", props.className)} />;
}

export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("card p-6 md:p-7 flex flex-col gap-5", className)}>{children}</div>;
}

export function FormRow({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const gridCls =
    cols === 1 ? "grid-cols-1" :
    cols === 2 ? "grid-cols-1 md:grid-cols-2" :
                 "grid-cols-1 md:grid-cols-3";
  return <div className={cn("grid gap-4", gridCls)}>{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 justify-end border-t border-juris-line-2 pt-4 mt-2">
      {children}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="text-xs px-3 py-2.5 rounded-md border border-juris-red/20 bg-juris-red/5 text-[#8A1F1D]">
      {children}
    </div>
  );
}
