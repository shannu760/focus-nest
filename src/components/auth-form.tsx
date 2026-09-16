"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Sprout } from "lucide-react";
import { Button, Input, Label, Select } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ApiError, api } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    classGrade: "Class 11",
    examTarget: "JEE Main",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errorMessage) setErrorMessage(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast({
        title: mode === "login" ? "Welcome back! 🌱" : "Account created 🎉",
        description: mode === "login" ? "Good to see you again." : "Your study nest is ready.",
      });
      window.location.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Please try again.";
      setErrorMessage(msg);
      toast({
        title: mode === "login" ? "Login failed" : "Sign up failed",
        description: msg,
        kind: "error",
      });
      setLoading(false);
    }
  }

  async function onResetAndUpdatePassword() {
    if (form.password.length < 8) {
      setErrorMessage("Please enter a password with at least 8 characters.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      toast({
        title: "Password updated & logged in! 🎉",
        description: "Welcome to your study dashboard.",
      });
      window.location.replace("/dashboard");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Could not update password.";
      setErrorMessage(msg);
      toast({
        title: "Failed to set password",
        description: msg,
        kind: "error",
      });
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700 flex flex-col gap-2">
          <p className="font-medium">{errorMessage}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/70">
            {mode === "signup" && errorMessage.toLowerCase().includes("already exists") && (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Log In instead →
                </Link>
                <button
                  type="button"
                  onClick={onResetAndUpdatePassword}
                  disabled={loading}
                  className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50"
                >
                  {loading ? "Updating..." : "Update password & log in"}
                </button>
              </>
            )}
            {mode === "login" && errorMessage.toLowerCase().includes("incorrect password") && (
              <button
                type="button"
                onClick={onResetAndUpdatePassword}
                disabled={loading}
                className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50"
              >
                {loading ? "Updating..." : "Reset password with this & log in"}
              </button>
            )}
          </div>
        </div>
      )}
      {mode === "signup" && (
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            required
            minLength={2}
            placeholder="Aarav Sharma"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
      )}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
      </div>

      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="classGrade">Class</Label>
            <Select
              id="classGrade"
              value={form.classGrade}
              onChange={(e) => set("classGrade", e.target.value)}
            >
              {["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="examTarget">Goal exam</Label>
            <Select
              id="examTarget"
              value={form.examTarget}
              onChange={(e) => set("examTarget", e.target.value)}
            >
              {["JEE Main", "JEE Advanced", "NEET", "BITSAT", "CUET", "Olympiads", "NTSE"].map(
                (c) => (
                  <option key={c}>{c}</option>
                )
              )}
            </Select>
          </div>
        </div>
      )}

      {mode === "login" && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-800 space-y-2">
          <p className="font-semibold text-indigo-900">Quick login presets (click to fill):</p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  email: "shanmukhakrishna2009@gmail.com",
                  password: "password123",
                }));
                if (errorMessage) setErrorMessage(null);
              }}
              className="flex items-center justify-between rounded-lg border border-indigo-200/80 bg-white px-2.5 py-1.5 text-left text-xs transition hover:bg-indigo-50/50 hover:border-indigo-300"
            >
              <div className="truncate pr-2">
                <span className="font-bold text-slate-800">Your Account:</span>{" "}
                <span className="text-slate-600">shanmukhakrishna2009@gmail.com</span>
              </div>
              <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                Click to fill
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setForm((f) => ({
                  ...f,
                  email: "demo@focusnest.app",
                  password: "demo1234",
                }));
                if (errorMessage) setErrorMessage(null);
              }}
              className="flex items-center justify-between rounded-lg border border-indigo-200/80 bg-white px-2.5 py-1.5 text-left text-xs transition hover:bg-indigo-50/50 hover:border-indigo-300"
            >
              <div className="truncate pr-2">
                <span className="font-bold text-slate-800">Demo Account:</span>{" "}
                <span className="text-slate-600">demo@focusnest.app</span>
              </div>
              <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                Click to fill
              </span>
            </button>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {mode === "login" ? "Log in" : "Create my account"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            New to FocusNest?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export function AuthLayout({
  mode,
  children,
}: {
  mode: "login" | "signup";
  children: React.ReactNode;
}) {
  const isLogin = mode === "login";
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-[28rem] rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sprout className="size-5" />
            </span>
            <span className="text-lg font-extrabold">FocusNest</span>
          </Link>
          <div>
            <h2 className="max-w-md text-4xl font-extrabold leading-tight">
              {isLogin ? "Your focus zone is waiting." : "Grow with a community that gets it."}
            </h2>
            <p className="mt-4 max-w-md text-indigo-100">
              {isLogin
                ? "Pick up your study pods, check your stress levels, and solve doubts with peers — all in one nest."
                : "Join students preparing for JEE, NEET, BITSAT and more. Study together, stress less, score higher."}
            </p>
            <div className="mt-8 flex gap-6 text-sm">
              <div>
                <p className="text-2xl font-extrabold">4,800+</p>
                <p className="text-indigo-200">students nested in</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold">31k</p>
                <p className="text-indigo-200">focus pods completed</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold">9.2k</p>
                <p className="text-indigo-200">doubts solved</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-indigo-200/70">
            “I stopped comparing my Chapter 6 with someone's Chapter 12.” — Riya, JEE aspirant
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Sprout className="size-5" />
            </span>
            <span className="text-lg font-extrabold text-slate-900">FocusNest</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isLogin ? "Welcome back 👋" : "Create your nest 🌱"}
          </h1>
          <p className="mt-1.5 mb-8 text-sm text-slate-500">
            {isLogin
              ? "Log in to continue your prep journey."
              : "Free forever for students. Takes 30 seconds."}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}
