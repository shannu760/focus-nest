"use client";

import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 focus-visible:ring-indigo-500",
    secondary:
      "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400",
    danger:
      "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 focus-visible:ring-rose-400",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 focus-visible:ring-emerald-500",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* --------------------------------- Inputs --------------------------------- */

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-xs font-semibold text-slate-600", className)}
    >
      {children}
    </label>
  );
}

/* ---------------------------------- Badge --------------------------------- */

const badgeColors: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  sky: "bg-sky-50 text-sky-700 border-sky-100",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

export function Badge({
  color = "slate",
  className,
  children,
}: {
  color?: keyof typeof badgeColors;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-200/70", className)} />;
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-100">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------- Spinner --------------------------------- */

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)] max-h-[92vh] overflow-y-auto",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------ Section title ----------------------------- */

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  seed,
  className,
}: {
  name: string;
  seed: string;
  className?: string;
}) {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-rose-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-sky-500",
    "bg-fuchsia-500",
    "bg-teal-500",
  ];
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  const color = colors[sum % colors.length];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        color,
        className
      )}
    >
      {initials}
    </span>
  );
}
