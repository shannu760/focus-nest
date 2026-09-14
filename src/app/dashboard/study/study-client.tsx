"use client";

import { useMemo, useState, useEffect, useRef, useTransition } from "react";
import {
  CalendarDays,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Modal,
  SectionTitle,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { SUBJECTS, cn, formatDate, formatMinutes, formatTime } from "@/lib/utils";
import type { StudySession } from "@/db/schema";

const PRESETS = [
  { label: "Quick 25", mins: 25 },
  { label: "Classic 50", mins: 50 },
  { label: "Deep 90", mins: 90 },
];

export function StudyClient({ initialSessions }: { initialSessions: StudySession[] }) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState(initialSessions);
  const [loading, setLoading] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  /* ------------------------------- pomodoro ------------------------------- */
  const [selectedMins, setSelectedMins] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // auto-save when the timer hits zero
  useEffect(() => {
    if (secondsLeft === 0 && selectedMins > 0) {
      const topicFinal = topic.trim() || `${subject} focus pod`;
      saveSession({
        subject,
        topic: topicFinal,
        durationMin: selectedMins,
        focusScore: 4,
      });
      toast({
        title: "Pod complete! 🎉",
        description: `${subject} · ${selectedMins} min saved to your log.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft === 0]);

  function pickPreset(mins: number) {
    setSelectedMins(mins);
    setSecondsLeft(mins * 60);
    setRunning(false);
  }

  function toggle() {
    if (secondsLeft === 0) setSecondsLeft(selectedMins * 60);
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSecondsLeft(selectedMins * 60);
  }

  /* ----------------------------- session CRUD ----------------------------- */

  async function saveSession(data: {
    subject: string;
    topic: string;
    durationMin: number;
    focusScore?: number | null;
    notes?: string | null;
  }) {
    setSaving(true);
    try {
      const row = await api<StudySession>("/api/study-sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      startTransition(() => setSessions((prev) => [row, ...prev]));
      return true;
    } catch (e) {
      toast({
        title: "Could not save pod",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(id: string) {
    // optimistic remove
    const previous = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await api(`/api/study-sessions/${id}`, { method: "DELETE" });
      toast({ title: "Pod removed", kind: "info" });
    } catch {
      setSessions(previous);
      toast({ title: "Could not remove pod", kind: "error" });
    }
  }

  /* ------------------------------ weekly chart ----------------------------- */

  const weekData = useMemo(() => {
    const days: { label: string; mins: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      const mins = sessions
        .filter((s) => new Date(s.completedAt).toDateString() === key)
        .reduce((sum, s) => sum + s.durationMin, 0);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
        mins,
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions]);

  const maxMins = Math.max(...weekData.map((d) => d.mins), 30);
  const weekTotal = weekData.reduce((s, d) => s + d.mins, 0);
  const todaySessions = sessions.filter(
    (s) => new Date(s.completedAt).toDateString() === new Date().toDateString()
  );

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;
  const progress = selectedMins > 0 ? 1 - secondsLeft / (selectedMins * 60) : 0;
  const R = 84;
  const C = 2 * Math.PI * R;

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SectionTitle
        title="Study Pods"
        subtitle="Deep work, one pod at a time. The timer auto-logs when it hits zero."
        action={
          <Button onClick={() => setLogOpen(true)}>
            <Plus className="size-4" /> Log a session
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Timer card */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Focus timer</h2>
            <Badge color={running ? "emerald" : "slate"}>
              {running ? "● In session" : "Idle"}
            </Badge>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="relative size-52">
              <svg viewBox="0 0 200 200" className="size-full -rotate-90">
                <circle cx="100" cy="100" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle
                  cx="100"
                  cy="100"
                  r={R}
                  fill="none"
                  stroke="url(#podGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - progress)}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="podGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-400">
                  of {selectedMins} min pod
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.mins}
                onClick={() => pickPreset(p.mins)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-xs font-bold transition cursor-pointer",
                  selectedMins === p.mins
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <Button onClick={toggle} className="flex-1" variant={running ? "secondary" : "primary"}>
              {running ? (
                <>
                  <Pause className="size-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="size-4" /> {secondsLeft > 0 && secondsLeft !== selectedMins * 60 ? "Resume" : "Start"}
                </>
              )}
            </Button>
            <Button onClick={reset} variant="secondary" aria-label="Reset timer">
              <RotateCcw className="size-4" />
            </Button>
          </div>

          <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pod-subject">Subject</Label>
                <Select id="pod-subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pod-topic">Topic (optional)</Label>
                <Input
                  id="pod-topic"
                  placeholder="e.g. Rotational motion"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              💡 When the timer finishes, this pod is saved automatically with your subject.
            </p>
          </div>
        </Card>

        {/* Chart + today */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <TrendingUp className="size-4 text-indigo-500" /> Last 7 days
              </h2>
              <Badge color="indigo">{formatMinutes(weekTotal)} total</Badge>
            </div>
            <div className="mt-6 flex h-44 items-end gap-3">
              {weekData.map((d) => (
                <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 opacity-0 transition group-hover:opacity-100">
                    {d.mins}m
                  </span>
                  <div className="flex w-full flex-1 items-end rounded-lg bg-slate-50">
                    <div
                      className={cn(
                        "w-full rounded-lg transition-all duration-500",
                        d.isToday
                          ? "bg-gradient-to-t from-indigo-600 to-violet-500"
                          : "bg-indigo-200 group-hover:bg-indigo-300"
                      )}
                      style={{ height: `${Math.max(4, (d.mins / maxMins) * 100)}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      d.isToday ? "text-indigo-600" : "text-slate-400"
                    )}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <CalendarDays className="size-4 text-indigo-500" /> Today's pods
                <Badge color="indigo">{todaySessions.length}</Badge>
              </h2>
            </div>
            {loading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : todaySessions.length === 0 ? (
              <EmptyState
                className="m-5 border-0 bg-transparent py-8"
                icon={<Timer className="size-6" />}
                title="No pods yet today"
                description="Hit start on the timer — your first pod of the day is one click away."
                action={
                  <Button size="sm" onClick={() => setRunning(true)}>
                    <Play className="size-3.5" /> Start a 25-min pod
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {todaySessions.map((s) => (
                  <li key={s.id} className="group flex items-center gap-3 px-5 py-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Flame className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {s.subject} — {s.topic}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTime(s.completedAt)}
                        {s.focusScore ? ` · focus ${"🔥".repeat(s.focusScore)}` : ""}
                      </p>
                    </div>
                    <Badge color="indigo">{s.durationMin} min</Badge>
                    <button
                      onClick={() => deleteSession(s.id)}
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                      aria-label="Delete pod"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="size-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Pod pro-tip</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  Deep work compounds: two 50-minute pods with a breathing break in between beat
                  four distracted hours. After 3 pods, reward yourself with the Relax Zone.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent history */}
      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Recent sessions</h2>
          <Badge color="slate">{sessions.length} logged</Badge>
        </div>
        {sessions.length === 0 ? (
          <EmptyState
            className="m-5"
            icon={<Timer className="size-6" />}
            title="No sessions yet"
            description="Your completed pods will appear here — log one manually or run the timer."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.slice(0, 12).map((s) => (
              <li key={s.id} className="group flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {s.subject} — {s.topic}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {formatDate(s.completedAt)}
                    {s.notes ? ` · ${s.notes}` : ""}
                  </p>
                </div>
                {s.focusScore && (
                  <Badge color="amber" className="hidden sm:inline-flex">
                    focus {s.focusScore}/5
                  </Badge>
                )}
                <Badge color="indigo">{s.durationMin} min</Badge>
                <button
                  onClick={() => deleteSession(s.id)}
                  className="rounded-lg p-1.5 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                  aria-label="Delete session"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Log modal */}
      <LogModal
        open={logOpen}
        saving={saving}
        onClose={() => setLogOpen(false)}
        onSave={async (data) => {
          const ok = await saveSession(data);
          if (ok) setLogOpen(false);
        }}
      />
    </div>
  );
}

function LogModal({
  open,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (d: { subject: string; topic: string; durationMin: number; focusScore: number | null; notes: string | null }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    subject: "Physics",
    topic: "",
    durationMin: "25",
    focusScore: "4",
    notes: "",
  });

  return (
    <Modal open={open} onClose={onClose} title="Log a study pod">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="log-subject">Subject</Label>
            <Select
              id="log-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="log-duration">Duration (min)</Label>
            <Input
              id="log-duration"
              type="number"
              min={1}
              max={600}
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="log-topic">Topic</Label>
          <Input
            id="log-topic"
            placeholder="What did you work on?"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          />
        </div>
        <div>
          <Label>Focus score: {form.focusScore}/5</Label>
          <input
            type="range"
            min={1}
            max={5}
            value={form.focusScore}
            onChange={(e) => setForm({ ...form, focusScore: e.target.value })}
            className="w-full"
          />
        </div>
        <div>
          <Label htmlFor="log-notes">Notes (optional)</Label>
          <Textarea
            id="log-notes"
            rows={2}
            placeholder="e.g. Stuck on integration by parts"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            onClick={() =>
              onSave({
                subject: form.subject,
                topic: form.topic || `${form.subject} focus pod`,
                durationMin: Number(form.durationMin) || 25,
                focusScore: Number(form.focusScore) || null,
                notes: form.notes || null,
              })
            }
          >
            Save pod
          </Button>
        </div>
      </div>
    </Modal>
  );
}
