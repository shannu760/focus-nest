"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  Leaf,
  MonitorOff,
  Moon,
  PersonStanding,
  Play,
  Plus,
  Smile,
  Sparkles,
  StopCircle,
  Trash2,
  Wind,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Label,
  Modal,
  SectionTitle,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import type { RelaxActivity } from "@/db/schema";

const ACTIVITIES = [
  {
    type: "breathing",
    title: "Box Breathing",
    description: "Inhale 4s · hold 4s · exhale 4s · hold 4s. Navy SEAL approved for exam panic.",
    icon: Wind,
    color: "from-sky-500 to-blue-600",
    emoji: "🌬️",
    href: "/dashboard/relax/breathing",
  },
  {
    type: "stretch",
    title: "Neck & Shoulder Stretch",
    description: "Release the hunch from hours of sitting. 8 minutes, zero equipment.",
    icon: PersonStanding,
    color: "from-emerald-500 to-teal-600",
    emoji: "🤸",
    href: "/dashboard/relax/stretch",
  },
  {
    type: "walk",
    title: "Mindful Walk",
    description: "No phone, no music — just you, your steps, and 20 minutes of fresh air.",
    icon: Leaf,
    color: "from-lime-500 to-green-600",
    emoji: "🚶",
    href: "/dashboard/relax/walk",
  },
  {
    type: "screen-break",
    title: "Screen Sunset",
    description: "Eyes off every screen. Look at something 20 feet away. Blink. Breathe.",
    icon: MonitorOff,
    color: "from-amber-500 to-orange-600",
    emoji: "🌇",
    href: "/dashboard/relax/screen-break",
  },
  {
    type: "music",
    title: "Lo-fi Music Break",
    description: "Headphones on, eyes closed, one playlist. Your brain's defrag button.",
    icon: Headphones,
    color: "from-violet-500 to-fuchsia-600",
    emoji: "🎧",
    href: "/dashboard/relax/music",
  },
  {
    type: "nap",
    title: "Power Nap",
    description: "15–20 minutes only. Set an alarm. Wake up with a refreshed prefrontal cortex.",
    icon: Moon,
    color: "from-slate-500 to-slate-700",
    emoji: "😴",
    href: "/dashboard/relax/nap",
  },
];

const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Rough", "Low", "Okay", "Good", "Great"];

export function RelaxClient({ initialActivities }: { initialActivities: RelaxActivity[] }) {
  const { toast } = useToast();
  const [activities, setActivities] = useState(initialActivities);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<(typeof ACTIVITIES)[number] | null>(null);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [breathing, setBreathing] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  /* breathing coach: 4-4-4 cycle */
  useEffect(() => {
    if (!breathing) return;
    const timer = setInterval(() => {
      setBreathSeconds((s) => {
        if (s > 1) return s - 1;
        setBreathPhase((p) => (p === "inhale" ? "hold" : p === "hold" ? "exhale" : "inhale"));
        return 4;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [breathing]);

  async function logActivity(
    data: Omit<RelaxActivity, "id" | "userId" | "completedAt">
  ) {
    try {
      const row = await api<RelaxActivity>("/api/relax", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setActivities((prev) => [row, ...prev]);
      return true;
    } catch (e) {
      toast({
        title: "Could not log activity",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
      return false;
    }
  }

  async function removeActivity(id: string) {
    const previous = activities;
    setActivities((prev) => prev.filter((a) => a.id !== id));
    try {
      await api(`/api/relax/${id}`, { method: "DELETE" });
      toast({ title: "Activity removed", kind: "info" });
    } catch {
      setActivities(previous);
      toast({ title: "Could not remove", kind: "error" });
    }
  }

  const totalMin = activities.reduce((s, a) => s + a.durationMin, 0);
  const avgBoost = activities.length
    ? (
        activities.reduce((s, a) => s + (a.moodAfter - a.moodBefore), 0) / activities.length
      ).toFixed(1)
    : "0.0";

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SectionTitle
        title="Relax Zone"
        subtitle="Rest is part of the plan. Pick a break, let your brain recharge."
        action={
          <Button variant="secondary" onClick={() => setLogOpen(true)}>
            <Plus className="size-4" /> Log manually
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Leaf className="size-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-slate-900">{activities.length}</p>
            <p className="text-xs font-semibold text-slate-500">breaks logged</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <StopCircle className="size-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-slate-900">{totalMin} min</p>
            <p className="text-xs font-semibold text-slate-500">of recovery time</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Smile className="size-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-slate-900">+{avgBoost}</p>
            <p className="text-xs font-semibold text-slate-500">avg mood boost per break</p>
          </div>
        </Card>
      </div>

      {/* Activity cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIVITIES.map((a) => {
          const count = activities.filter((x) => x.activityType === a.type).length;
          return (
            <Card key={a.type} className="group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                    a.color
                  )}
                >
                  <a.icon className="size-5.5" />
                </span>
                {count > 0 && <Badge color="emerald">{count}× done</Badge>}
              </div>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">
                {a.emoji} {a.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-500">
                {a.description}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {a.type === "breathing" ? (
                  <div className="flex items-center gap-2">
                    <Button
                      className="flex-1"
                      variant="secondary"
                      onClick={() => {
                        setActive(a);
                        setBreathing(true);
                        setBreathPhase("inhale");
                        setBreathSeconds(4);
                      }}
                    >
                      <Play className="size-4" /> Quick breathe
                    </Button>
                    <Link
                      href={a.href}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-sky-700 hover:bg-sky-50 transition"
                      title="Open full Breathing Studio"
                    >
                      Studio →
                    </Link>
                  </div>
                ) : (
                  <Link href={a.href} className="w-full">
                    <Button className="w-full" variant="secondary">
                      <Play className="size-4" /> Start this break
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* History */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Relaxation history</h2>
          <Badge color="slate">{activities.length} logged</Badge>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            className="m-5"
            icon={<Leaf className="size-6" />}
            title="No breaks logged yet"
            description="Try the Box Breathing exercise above — your future calm self says thanks."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {activities.slice(0, 15).map((a) => (
              <li key={a.id} className="group flex items-center gap-3 px-5 py-3.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-xl",
                    a.activityType === "breathing"
                      ? "bg-sky-50 text-sky-600"
                      : a.activityType === "stretch"
                      ? "bg-emerald-50 text-emerald-600"
                      : a.activityType === "walk"
                      ? "bg-lime-50 text-lime-700"
                      : a.activityType === "screen-break"
                      ? "bg-amber-50 text-amber-600"
                      : a.activityType === "music"
                      ? "bg-violet-50 text-violet-600"
                      : a.activityType === "nap"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-emerald-50 text-emerald-600"
                  )}
                >
                  {a.activityType === "breathing" ? (
                    <Wind className="size-4.5" />
                  ) : a.activityType === "stretch" ? (
                    <PersonStanding className="size-4.5" />
                  ) : a.activityType === "walk" ? (
                    <Leaf className="size-4.5" />
                  ) : a.activityType === "screen-break" ? (
                    <MonitorOff className="size-4.5" />
                  ) : a.activityType === "music" ? (
                    <Headphones className="size-4.5" />
                  ) : a.activityType === "nap" ? (
                    <Moon className="size-4.5" />
                  ) : (
                    <Smile className="size-4.5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(a.completedAt)} · {timeAgo(a.completedAt)}
                  </p>
                </div>
                <Badge color="emerald">
                  {a.moodBefore} → {a.moodAfter} mood
                </Badge>
                <Badge color="slate">{a.durationMin} min</Badge>
                <button
                  onClick={() => removeActivity(a.id)}
                  className="rounded-lg p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                  aria-label="Delete entry"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Breathing coach modal */}
      <Modal
        open={!!active && active.type === "breathing"}
        onClose={() => {
          setActive(null);
          setBreathing(false);
        }}
        title="Box Breathing Coach"
      >
        {active && (
          <div className="flex flex-col items-center py-4">
            <div className="relative flex size-56 items-center justify-center">
              <div
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-br from-sky-200/60 to-blue-200/60",
                  breathing && breathPhase === "inhale" && "animate-breathe"
                )}
                style={{ transition: "transform 1s" }}
              />
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-sky-300/70 to-blue-300/70 blur-[2px]" />
              <div className="relative z-10 text-center">
                <p className="text-2xl font-extrabold text-sky-900">
                  {breathing ? (breathPhase === "inhale" ? "Inhale" : breathPhase === "hold" ? "Hold" : "Exhale") : "Ready?"}
                </p>
                <p className="mt-1 text-sm font-bold text-sky-700">
                  {breathing ? `${breathSeconds} s` : "Follow the circle"}
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-center text-sm leading-relaxed text-slate-500">
              Breathe in through the nose as the circle grows, hold, then exhale slowly through
              the mouth. Do 10 cycles — about 4 minutes.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant={breathing ? "secondary" : "primary"}
                onClick={() => {
                  setBreathing((b) => !b);
                  if (!breathing) {
                    setBreathPhase("inhale");
                    setBreathSeconds(4);
                  }
                }}
              >
                {breathing ? (
                  <>
                    <StopCircle className="size-4" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="size-4" /> Start
                  </>
                )}
              </Button>
              <Button
                variant="success"
                loading={saving}
                onClick={async () => {
                  setSaving(true);
                  const ok = await logActivity({
                    activityType: "breathing",
                    title: "Box Breathing",
                    durationMin: 5,
                    moodBefore: 2,
                    moodAfter: 4,
                  });
                  setSaving(false);
                  if (ok) {
                    setActive(null);
                    setBreathing(false);
                    toast({ title: "Breathing break saved 🌬️", description: "Mood boost logged." });
                  }
                }}
              >
                Finish & save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual log modal */}
      <ManualLogModal
        open={logOpen}
        saving={saving}
        onClose={() => setLogOpen(false)}
        onSave={async (data) => {
          setSaving(true);
          const ok = await logActivity(data);
          setSaving(false);
          if (ok) {
            setLogOpen(false);
            toast({ title: "Break logged 🌿" });
          }
        }}
      />
    </div>
  );
}

function ManualLogModal({
  open,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (d: { activityType: string; title: string; durationMin: number; moodBefore: number; moodAfter: number }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "",
    durationMin: "10",
    moodBefore: 3,
    moodAfter: 4,
  });

  return (
    <Modal open={open} onClose={onClose} title="Log a relaxation break">
      <div className="space-y-4">
        <div>
          <Label htmlFor="relax-title">What did you do?</Label>
          <Textarea
            id="relax-title"
            rows={2}
            placeholder="e.g. Stretched on the terrace, watched birds for a bit…"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="relax-duration">Duration (minutes)</Label>
          <input
            id="relax-duration"
            type="range"
            min={1}
            max={60}
            value={form.durationMin}
            onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
            className="w-full"
          />
          <p className="mt-1 text-center text-sm font-bold text-slate-700">{form.durationMin} min</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Mood before</Label>
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, moodBefore: m })}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-bold transition cursor-pointer",
                    form.moodBefore === m
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{MOOD_LABELS[form.moodBefore - 1]}</p>
          </div>
          <div>
            <Label>Mood after</Label>
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, moodAfter: m })}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm font-bold transition cursor-pointer",
                    form.moodAfter === m
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-400 hover:border-slate-300"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{MOOD_LABELS[form.moodAfter - 1]}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            onClick={() =>
              onSave({
                activityType: "custom",
                title: form.title || "Custom break",
                durationMin: Number(form.durationMin) || 10,
                moodBefore: form.moodBefore,
                moodAfter: form.moodAfter,
              })
            }
          >
            Save break
          </Button>
        </div>
      </div>
    </Modal>
  );
}
