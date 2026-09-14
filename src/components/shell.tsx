"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpenCheck,
  Brain,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Sprout,
  Timer,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import type { User } from "@/db/schema";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/study", label: "Study Pods", icon: Timer },
  { href: "/dashboard/relax", label: "Relax Zone", icon: Leaf },
  { href: "/dashboard/stress", label: "Stress Care", icon: HeartPulse },
  { href: "/dashboard/peers", label: "Peers", icon: Users },
  { href: "/dashboard/doubts", label: "Doubt Desk", icon: MessageCircleQuestion },
];

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      toast({ title: "Could not log out", kind: "error" });
      setLoggingOut(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
          <Sprout className="size-5" />
        </span>
        <span>
          <span className="block text-[15px] font-extrabold tracking-tight text-slate-900">
            FocusNest
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            study companion
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0",
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              {item.label}
              {active && (
                <span className="ml-auto size-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/70 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user.name} seed={user.id} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">
              {user.classGrade} · {user.examTarget}
            </p>
          </div>
          <button
            onClick={logout}
            disabled={loggingOut}
            title="Log out"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/80 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl animate-[slideIn_0.2s_ease-out]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <Sprout className="size-4" />
          </span>
          <span className="text-sm font-extrabold text-slate-900">FocusNest</span>
        </Link>
        <div className="ml-auto">
          <Avatar name={user.name} seed={user.id} className="size-8 text-[10px]" />
        </div>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/* Quick-link card used on the overview page */
export function QuickLink({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
          color
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
          {title}
          <ChevronRight className="size-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
          {description}
        </span>
      </span>
    </Link>
  );
}

/* Small inline icon exports for reuse on overview */
export { Brain, BookOpenCheck, FlaskConical };
