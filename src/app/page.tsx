import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Headphones,
  HeartPulse,
  Leaf,
  MessageCircleQuestion,
  Sprout,
  Timer,
  Users,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

const FEATURES = [
  {
    icon: Timer,
    color: "bg-indigo-500",
    title: "Study Time Pods",
    description:
      "Pomodoro-style focus pods with a built-in timer. Track every minute by subject and watch your weekly streak grow.",
  },
  {
    icon: Leaf,
    color: "bg-emerald-500",
    title: "Relaxation Time",
    description:
      "Guided breathing exercises, stretch breaks and mindful pauses — because recovery is part of the study plan.",
  },
  {
    icon: HeartPulse,
    color: "bg-rose-500",
    title: "Stress Management",
    description:
      "Daily stress check-ins with a personal trend chart, trigger tracking, and coping playbooks that actually work.",
  },
  {
    icon: Users,
    color: "bg-sky-500",
    title: "Peer Support",
    description:
      "Find study buddies at the same level. Compare progress healthily, not toxically — peer pressure handled.",
  },
  {
    icon: MessageCircleQuestion,
    color: "bg-amber-500",
    title: "Doubt Desk",
    description:
      "Post a doubt, get answers from students who've been there. Upvote, accept best answers, and pay it forward.",
  },
  {
    icon: Headphones,
    color: "bg-violet-500",
    title: "Ambient Soundscapes",
    description:
      "Synthesized Lo-Fi audio, binaural focus frequencies, and nature sounds engineered to enter deep flow and block distractions.",
  },
];

const EXAMS = ["JEE Main", "JEE Advanced", "NEET", "BITSAT", "CUET", "IOQM · NSEJS", "NTSE"];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
              <Sprout className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">
              FocusNest
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700"
              >
                Open my dashboard <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-700"
                >
                  Sign up free
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 left-1/3 size-[36rem] rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 size-96 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700">
              <Brain className="size-3.5" /> Built for JEE · NEET · Board students
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Study harder,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                stress smarter.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              FocusNest is your all-in-one study companion — focus pods, guided relaxation,
              stress check-ins, study buddies, and doubt solving for
              students from Class 8 to 12.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-indigo-600 px-6 text-base font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Start free — no card needed <ArrowRight className="size-4" />
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Try the demo
                </Link>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {[
                ["31,000+", "focus pods done"],
                ["9,200+", "doubts solved"],
                ["4,800+", "students nested"],
              ].map(([num, label]) => (
                <div key={label}>
                  <p className="text-xl font-extrabold text-slate-900">{num}</p>
                  <p className="text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-indigo-100 via-white to-violet-100" />
            <Image
              src="/images/hero.png"
              alt="Students studying together calmly"
              width={640}
              height={480}
              priority
              className="relative w-full rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-200/50"
            />
            <div className="absolute -bottom-5 -left-4 flex animate-float items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:-left-8">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Leaf className="size-4.5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Breathing break logged</p>
                <p className="text-[11px] text-slate-500">Stress 7 → 3 in 5 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam strip */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm font-bold tracking-wide text-slate-400">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Covers
          </span>
          {EXAMS.map((e) => (
            <span key={e} className="text-slate-500">
              {e}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything a student needs,{" "}
            <span className="text-indigo-600">under one roof</span>
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Toppers don't grind 24/7 — they balance focus, rest and support. FocusNest gives
            you the toolkit.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-2xl ${f.color} text-white shadow-md`}
              >
                <f.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Peer pressure callout */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-8 py-12 text-white sm:px-14">
          <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold">
                <BookOpenCheck className="size-3.5" /> Healthy peer culture
              </span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
                Peer pressure, but make it productive.
              </h2>
              <p className="mt-4 max-w-xl text-indigo-100">
                “Everyone finished Chapter 6 already” should never rule your day. FocusNest
                turns comparison into collaboration — study pods with buddies, doubt swaps,
                and pressure-reset playbooks when classmates get loud.
              </p>
            </div>
            <div className="grid gap-3">
              {[
                "🎯 Compare with your yesterday, not someone's today",
                "🛟 Peer pods only with people at your pace",
                "🧘 5-minute pressure-reset routine in Stress Care",
              ].map((t) => (
                <div
                  key={t}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-slate-100 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Three steps to a calmer grind
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "1",
                title: "Nest in",
                body: "Create your free account with your class and target exam. Your dashboard tunes itself to you.",
              },
              {
                n: "2",
                title: "Pod up",
                body: "Run focus pods, log stress check-ins, and team up with peers at your level. Ask doubts anytime.",
              },
              {
                n: "3",
                title: "Level up",
                body: "Track your focus trends, maintain your daily wellness streaks, and watch consistency compound.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-3xl border border-slate-200/80 bg-white p-7">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-extrabold text-indigo-600">
                  {s.n}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Your syllabus won't shrink. Your stress can.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Join thousands of students turning exam season into a season they actually survive —
          and enjoy.
        </p>
        <Link
          href={user ? "/dashboard" : "/signup"}
          className="mt-8 inline-flex h-13 items-center gap-2 rounded-2xl bg-indigo-600 px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          {user ? "Go to dashboard" : "Create free account"} <ArrowRight className="size-5" />
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:px-6">
          <div className="flex items-center gap-2">
            <Sprout className="size-4 text-indigo-500" />
            <span className="font-bold text-slate-600">FocusNest</span>
          </div>
          <p>Made with ☕ and deep work · For students, by students</p>
        </div>
      </footer>
    </div>
  );
}
