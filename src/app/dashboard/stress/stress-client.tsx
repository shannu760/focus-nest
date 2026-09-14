"use client";

import { useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  Wind,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Label,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { StressCheckin } from "@/db/schema";

const MOODS = [
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "okay", emoji: "🙂", label: "Okay" },
  { value: "anxious", emoji: "😰", label: "Anxious" },
  { value: "overwhelmed", emoji: "😵‍💫", label: "Overwhelmed" },
];

const TRIGGERS = [
  "Exam pressure",
  "Syllabus backlog",
  "Comparing with others",
  "Phone / distractions",
  "Parents' expectations",
  "Sleep problems",
];

const COPING_TIPS = [
  {
    icon: Wind,
    color: "bg-sky-50 text-sky-600",
    title: "5-4-3-2-1 grounding",
    body: "Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Pulls you out of panic in 60 seconds.",
  },
  {
    icon: Brain,
    color: "bg-violet-50 text-violet-600",
    title: "Reframe the fear",
    body: "Write 'I have a lot to study' → reframe as 'I have 12 focused hours left and a plan'. Stress is often an unplanned plan.",
  },
  {
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    title: "Protect the first hour",
    body: "Studying for just 5 minutes lowers task anxiety. Start with an easy win (revision notes) before hard problems.",
  },
  {
    icon: Sparkles,
    color: "bg-amber-50 text-amber-600",
    title: "Worry window",
    body: "Schedule 15 minutes at 7pm as your official 'worry window'. Outside it, write worries down and defer them.",
  },
];

function stressColor(level: number) {
  if (level <= 3) return { text: "text-emerald-600", bg: "bg-emerald-500", label: "Low" };
  if (level <= 6) return { text: "text-amber-600", bg: "bg-amber-500", label: "Moderate" };
  return { text: "text-rose-600", bg: "bg-rose-500", label: "High" };
}

export function StressClient({ initialCheckins }: { initialCheckins: StressCheckin[] }) {
  const { toast } = useToast();
  const [checkins, setCheckins] = useState(initialCheckins);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    stressLevel: 5,
    mood: "okay",
    triggers: [] as string[],
    note: "",
  });

  const sorted = useMemo(
    () => [...checkins].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [checkins]
  );

  function toggleTrigger(t: string) {
    setForm((f) => ({
      ...f,
      triggers: f.triggers.includes(t) ? f.triggers.filter((x) => x !== t) : [...f.triggers, t],
    }));
  }

  async function submit() {
    setSaving(true);
    try {
      const row = await api<StressCheckin>("/api/checkins", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCheckins((prev) => [row, ...prev]);
      setForm({ stressLevel: 5, mood: "okay", triggers: [], note: "" });
      toast({
        title: "Check-in saved 💛",
        description: form.stressLevel >= 7
          ? "That's a lot to carry. Try one coping tip below."
          : "Thanks for tuning in with yourself.",
      });
    } catch (e) {
      toast({
        title: "Could not save check-in",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const previous = checkins;
    setCheckins((prev) => prev.filter((c) => c.id !== id));
    try {
      await api(`/api/checkins/${id}`, { method: "DELETE" });
      toast({ title: "Check-in removed", kind: "info" });
    } catch {
      setCheckins(previous);
      toast({ title: "Could not remove", kind: "error" });
    }
  }

  const avg = sorted.length
    ? Math.round(sorted.reduce((s, c) => s + c.stressLevel, 0) / sorted.length)
    : 0;
  const trendUp = sorted.length >= 2 && sorted[sorted.length - 1].stressLevel >= sorted[sorted.length - 2].stressLevel;

  const level = stressColor(form.stressLevel);

  // sparkline
  const points = useMemo(() => {
    if (sorted.length < 2) return "";
    const W = 280, H = 72, P = 8;
    return sorted
      .map((c, i) => {
        const x = P + (i / (sorted.length - 1)) * (W - P * 2);
        const y = H - P - ((c.stressLevel - 1) / 9) * (H - P * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }, [sorted]);

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SectionTitle
        title="Stress Care"
        subtitle="Check in daily — noticing stress early is half the battle."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Check-in form */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <HeartPulse className="size-4 text-rose-500" /> How are you right now?
          </h2>

          <div className="mt-6 text-center">
            <p className={cn("text-5xl font-extrabold tracking-tight", level.text)}>
              {form.stressLevel}
              <span className="text-lg text-slate-400">/10</span>
            </p>
            <p className={cn("mt-1 text-xs font-bold uppercase tracking-wide", level.text)}>
              {level.label} stress
            </p>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            value={form.stressLevel}
            onChange={(e) => setForm({ ...form, stressLevel: Number(e.target.value) })}
            className="mt-5 w-full"
            aria-label="Stress level"
          />

          <div className="mt-6">
            <Label>Mood</Label>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setForm({ ...form, mood: m.value })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition cursor-pointer",
                    form.mood === m.value
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <span className="text-lg">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <Label>What's driving it? (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {TRIGGERS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTrigger(t)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer",
                    form.triggers.includes(t)
                      ? "border-rose-300 bg-rose-50 text-rose-600"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <Label htmlFor="stress-note">Note to self (optional)</Label>
            <Textarea
              id="stress-note"
              rows={2}
              placeholder="Anything you want to remember later…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <Button className="mt-5 w-full" loading={saving} onClick={submit}>
            Save check-in
          </Button>
        </Card>

        {/* Trend + history */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <TrendingDown className="size-4 text-indigo-500" /> Stress trend
              </h2>
              {sorted.length > 0 && (
                <div className="flex gap-2">
                  <Badge color="indigo">7d avg {avg}/10</Badge>
                  <Badge color={trendUp ? "rose" : "emerald"}>
                    {trendUp ? "↑ rising — take a break soon" : "↓ easing — keep it up"}
                  </Badge>
                </div>
              )}
            </div>
            {sorted.length < 2 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                Log at least two check-ins to see your trend line.
              </p>
            ) : (
              <div className="mt-4">
                <svg viewBox="0 0 280 72" className="h-32 w-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line
                      key={f}
                      x1="0"
                      x2="280"
                      y1={72 * f}
                      y2={72 * f}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}
                  <polygon points={`8,64 ${points} 272,64`} fill="url(#stressFill)" />
                  <polyline
                    points={points}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sorted.map((c, i) => {
                    const x = 8 + (i / (sorted.length - 1)) * (280 - 16);
                    const y = 64 - ((c.stressLevel - 1) / 9) * (72 - 16);
                    return <circle key={c.id} cx={x} cy={y} r="3.5" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />;
                  })}
                </svg>
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>{formatDate(sorted[0].createdAt)}</span>
                  <span>{formatDate(sorted[sorted.length - 1].createdAt)}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Coping tips */}
          <div>
            <h2 className="mb-3 text-sm font-extrabold text-slate-900">
              Coping playbook when stress hits 7+
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {COPING_TIPS.map((t) => (
                <Card key={t.title} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", t.color)}>
                      <t.icon className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">{t.body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Check-in history</h2>
          <Badge color="slate">{checkins.length} entries</Badge>
        </div>
        {checkins.length === 0 ? (
          <EmptyState
            className="m-5"
            icon={<HeartPulse className="size-6" />}
            title="No check-ins yet"
            description="Your first check-in takes 10 seconds and starts your trend chart."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {checkins.slice(0, 15).map((c) => {
              const lvl = stressColor(c.stressLevel);
              return (
                <li key={c.id} className="group flex items-start gap-3 px-5 py-4">
                  <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", lvl.bg)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">
                        {c.stressLevel}/10 · {c.mood}
                      </p>
                      <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                      {c.triggers.length > 0 && (
                        <span className="flex flex-wrap gap-1.5">
                          {c.triggers.map((t) => (
                            <Badge key={t} color="rose">
                              {t}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </div>
                    {c.note && (
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">“{c.note}”</p>
                    )}
                  </div>
                  <button
                    onClick={() => remove(c.id)}
                    className="rounded-lg p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                    aria-label="Delete check-in"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Weekly affirmation */}
      <Card className="mt-6 flex items-start gap-3 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
          <CheckCircle2 className="size-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">This week's reminder</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Your worth is not your marksheet. A check-in that says 8/10 stress is not failure —
            it's information. Act on it: breathe, walk, ask a peer. You've got this.
          </p>
        </div>
      </Card>
    </div>
  );
}
