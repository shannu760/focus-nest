import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  BookOpenCheck,
  Flame,
  HeartPulse,
  Leaf,
  MessageCircleQuestion,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { db } from "@/db";
import {
  doubtAnswers,
  doubts,
  peers,
  stressCheckins,
  studySessions,
} from "@/db/schema";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { QuickLink } from "@/components/shell";
import { Badge, Card } from "@/components/ui";
import { cn, formatMinutes, timeAgo, todayLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

const QUOTES = [
  { text: "You don't have to be extreme, just consistent.", author: "FocusNest" },
  { text: "Rest is a part of the study plan, not a break from it.", author: "FocusNest" },
  { text: "Comparison is the thief of joy — and of marks.", author: "FocusNest" },
  { text: "One focused pod beats three distracted hours.", author: "FocusNest" },
  { text: "The syllabus is finite. Your effort isn't.", author: "FocusNest" },
  { text: "Ask the doubt today; the exam won't wait.", author: "FocusNest" },
  { text: "Slow progress is still progress. Keep the streak alive.", author: "FocusNest" },
];

export default async function OverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayStudy] = await db
    .select({ total: sql<number>`coalesce(sum(duration_min), 0)::int` })
    .from(studySessions)
    .where(and(eq(studySessions.userId, user.id), gte(studySessions.completedAt, dayStart)));

  const [weekStudy] = await db
    .select({ total: sql<number>`coalesce(sum(duration_min), 0)::int` })
    .from(studySessions)
    .where(and(eq(studySessions.userId, user.id), gte(studySessions.completedAt, weekAgo)));

  const [stressAvg] = await db
    .select({ avg: sql<number>`coalesce(avg(stress_level), 0)::float` })
    .from(stressCheckins)
    .where(and(eq(stressCheckins.userId, user.id), gte(stressCheckins.createdAt, weekAgo)));

  const [openDoubts] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(doubts)
    .where(eq(doubts.resolved, false));

  const [peerCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(peers)
    .where(
      and(
        eq(peers.status, "accepted"),
        sql`(${peers.requesterId} = ${user.id} or ${peers.addresseeId} = ${user.id})`
      )
    );

  const recentStudy = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, user.id))
    .orderBy(desc(studySessions.completedAt))
    .limit(4);

  const recentCheckins = await db
    .select()
    .from(stressCheckins)
    .where(eq(stressCheckins.userId, user.id))
    .orderBy(desc(stressCheckins.createdAt))
    .limit(2);

  const recentDoubts = await db
    .select({ doubt: doubts, answerCount: sql<number>`count(${doubtAnswers.id})::int` })
    .from(doubts)
    .leftJoin(doubtAnswers, eq(doubtAnswers.doubtId, doubts.id))
    .groupBy(doubts.id)
    .orderBy(desc(doubts.createdAt))
    .limit(3);

  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stressLevel = Math.round(stressAvg.avg);
  const stressColor =
    stressLevel <= 4 ? "text-emerald-600" : stressLevel <= 7 ? "text-amber-600" : "text-rose-600";
  const stressLabel =
    stressLevel <= 4 ? "Low & healthy" : stressLevel <= 7 ? "Mild — worth a break" : "High — relax zone time";

  const stats = [
    {
      label: "Focus today",
      value: formatMinutes(todayStudy.total),
      sub: `${formatMinutes(weekStudy.total)} this week`,
      icon: Timer,
      color: "bg-indigo-500",
      href: "/dashboard/study",
    },
    {
      label: "Avg stress (7d)",
      value: `${stressLevel}/10`,
      sub: stressLabel,
      icon: HeartPulse,
      color: "bg-rose-500",
      valueClass: stressColor,
      href: "/dashboard/stress",
    },
    {
      label: "Open doubts",
      value: String(openDoubts.n),
      sub: "across the community",
      icon: MessageCircleQuestion,
      color: "bg-amber-500",
      href: "/dashboard/doubts",
    },
    {
      label: "Study peers",
      value: String(peerCount.n),
      sub: "in your nest",
      icon: Users,
      color: "bg-emerald-500",
      href: "/dashboard/peers",
    },
  ];

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{todayLabel()}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {greeting}, {user.name.split(" ")[0]} 👋
          </h1>
        </div>
        <Card className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Sparkles className="size-4.5" />
          </span>
          <div>
            <p className="max-w-xs text-xs font-medium leading-snug text-slate-700">
              “{quote.text}”
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              — {quote.author}
            </p>
          </div>
        </Card>
      </div>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-indigo-200">
              <div className="flex items-center justify-between">
                <span className={cn("flex size-10 items-center justify-center rounded-xl text-white shadow-sm", s.color)}>
                  <s.icon className="size-5" />
                </span>
                <ArrowUpRight className="size-4 text-slate-300 transition group-hover:text-indigo-400" />
              </div>
              <p className={cn("mt-4 text-2xl font-extrabold tracking-tight text-slate-900", s.valueClass)}>
                {s.value}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-600">{s.label}</p>
              <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/dashboard/study"
          icon={<Timer className="size-5" />}
          color="bg-gradient-to-br from-indigo-500 to-blue-600"
          title="Start a focus pod"
          description="25-min deep work timer with subject logging."
        />
        <QuickLink
          href="/dashboard/relax"
          icon={<Leaf className="size-5" />}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          title="Take a breather"
          description="Guided box breathing & stretch breaks."
        />
        <QuickLink
          href="/dashboard/stress"
          icon={<HeartPulse className="size-5" />}
          color="bg-gradient-to-br from-rose-500 to-pink-600"
          title="Log a check-in"
          description="Track today's stress level in 10 seconds."
        />
        <QuickLink
          href="/dashboard/peers"
          icon={<Users className="size-5" />}
          color="bg-gradient-to-br from-sky-500 to-cyan-600"
          title="Find study buddies"
          description="Match with peers at your class level."
        />
        <QuickLink
          href="/dashboard/doubts"
          icon={<MessageCircleQuestion className="size-5" />}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          title="Ask a doubt"
          description="Stuck on a concept? The community answers."
        />
      </div>

      {/* Recent activity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Recent focus pods</h2>
            <Link
              href="/dashboard/study"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
          {recentStudy.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              No pods yet — start your first one above ☝️
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentStudy.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Flame className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {s.subject} — {s.topic}
                    </p>
                    <p className="text-xs text-slate-400">{timeAgo(s.completedAt)}</p>
                  </div>
                  <Badge color="indigo">{s.durationMin} min</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-extrabold text-slate-900">Latest check-ins</h2>
              <Link
                href="/dashboard/stress"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Manage →
              </Link>
            </div>
            {recentCheckins.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">
                No check-ins yet. How are you feeling?
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentCheckins.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                      <HeartPulse className="size-4.5" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold capitalize text-slate-800">{c.mood}</p>
                      <p className="text-xs text-slate-400">{timeAgo(c.createdAt)}</p>
                    </div>
                    <span className="text-sm font-extrabold text-slate-700">{c.stressLevel}/10</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-extrabold text-slate-900">Fresh doubts</h2>
              <Link
                href="/dashboard/doubts"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                Help out →
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentDoubts.map(({ doubt, answerCount }) => (
                <li key={doubt.id} className="px-5 py-3.5">
                  <Link href="/dashboard/doubts" className="group">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                      {doubt.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                      <Badge color="violet">{doubt.subject}</Badge>
                      <span>
                        {answerCount} {answerCount === 1 ? "answer" : "answers"} ·{" "}
                        {timeAgo(doubt.createdAt)}
                      </span>
                      {doubt.resolved && <Badge color="emerald">solved</Badge>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
