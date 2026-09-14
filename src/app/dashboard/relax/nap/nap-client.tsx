"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  AlarmClockOff,
  ArrowLeft,
  Bed,
  Brain,
  CheckCircle2,
  Clock,
  Droplet,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { relaxAudio } from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

const NAP_PRESETS = [
  {
    duration: 10,
    title: "10-Min Micro Refresh",
    tag: "Quick Boost",
    desc: "Stage 2 non-REM sleep. Immediate cognitive alertness without grogginess.",
  },
  {
    duration: 20,
    title: "20-Min NASA Power Nap",
    tag: "Gold Standard",
    desc: "Proven to boost academic test performance by 34% and working memory.",
  },
  {
    duration: 26,
    title: "26-Min Executive Snooze",
    tag: "Deep Recharge",
    desc: "Optimal daytime recharge duration identified in aviation sleep studies.",
  },
];

const BUFFERS = [
  { min: 0, label: "Immediate" },
  { min: 3, label: "+3m Drift" },
  { min: 5, label: "+5m Relax" },
];

const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Brain-Dead", "Drowsy", "Neutral", "Awake", "Sharpened"];

export function NapClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedDuration, setSelectedDuration] = useState(20);
  const [selectedBuffer, setSelectedBuffer] = useState(3);
  const [driftSound, setDriftSound] = useState(true);

  const [phase, setPhase] = useState<"idle" | "buffer" | "napping" | "alarm" | "completed">("idle");
  const [secondsRemaining, setSecondsRemaining] = useState((selectedDuration + selectedBuffer) * 60);

  const [moodBefore, setMoodBefore] = useState(1);
  const [moodAfter, setMoodAfter] = useState(4);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync initial seconds
  useEffect(() => {
    if (phase === "idle") {
      setSecondsRemaining((selectedDuration + selectedBuffer) * 60);
    }
  }, [selectedDuration, selectedBuffer, phase]);

  // Main nap countdown loop
  useEffect(() => {
    if (phase !== "buffer" && phase !== "napping") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time's up! Wake up alarm
          setPhase("alarm");
          if (relaxAudio) {
            relaxAudio.stopAllSoundscapes();
            relaxAudio.startGentleWakeAlarm();
          }
          return 0;
        }

        const next = prev - 1;
        // Check if transition from buffer to napping
        if (phase === "buffer" && next <= selectedDuration * 60) {
          setPhase("napping");
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, selectedDuration]);

  // Handle drift audio
  useEffect(() => {
    if (!relaxAudio) return;
    if ((phase === "buffer" || phase === "napping") && driftSound) {
      relaxAudio.setMasterVolume(0.5);
      relaxAudio.setTrackVolume("brownNoise", 0.4);
      relaxAudio.setTrackVolume("alphaWaves", 0.3);
    } else if (phase !== "alarm") {
      relaxAudio.stopAllSoundscapes();
    }
  }, [phase, driftSound]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (relaxAudio) {
        relaxAudio.stopAllSoundscapes();
        relaxAudio.stopGentleWakeAlarm();
      }
    };
  }, []);

  function handleStartNap() {
    setSecondsRemaining((selectedDuration + selectedBuffer) * 60);
    setPhase(selectedBuffer > 0 ? "buffer" : "napping");
    if (relaxAudio) relaxAudio.playChime(440, 2);
  }

  function handleStopAlarm() {
    if (relaxAudio) relaxAudio.stopGentleWakeAlarm();
    setPhase("completed");
  }

  function handleCancel() {
    if (relaxAudio) {
      relaxAudio.stopAllSoundscapes();
      relaxAudio.stopGentleWakeAlarm();
    }
    setPhase("idle");
    setSecondsRemaining((selectedDuration + selectedBuffer) * 60);
  }

  function formatTime(s: number) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleSaveSession() {
    setSaving(true);
    try {
      await api("/api/relax", {
        method: "POST",
        body: JSON.stringify({
          activityType: "nap",
          title: `Power Nap (${selectedDuration} min)`,
          durationMin: selectedDuration,
          moodBefore,
          moodAfter,
        }),
      });
      toast({
        title: "Power nap logged! 😴",
        description: `Prefrontal cortex refreshed (+${moodAfter - moodBefore} alertness boost).`,
        kind: "success",
      });
      router.push("/dashboard/relax");
    } catch (e) {
      toast({
        title: "Could not save activity",
        description: e instanceof Error ? e.message : "Please try again.",
        kind: "error",
      });
      setSaving(false);
    }
  }

  const totalSecs = (selectedDuration + selectedBuffer) * 60;
  const progressPercent = Math.min(100, Math.round(((totalSecs - secondsRemaining) / totalSecs) * 100));

  return (
    <div className="mx-auto max-w-4xl animate-[fadeIn_0.3s_ease-out] pb-12">
      {/* Back navigation */}
      <div className="mb-4">
        <Link
          href="/dashboard/relax"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="size-4" /> Back to Relax Zone
        </Link>
      </div>

      <SectionTitle
        title="Power Nap Sanctuary"
        subtitle="15–25 minutes only. Prevent sleep inertia while clearing cellular adenosine buildup."
        action={
          <button
            onClick={() => setDriftSound((s) => !s)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            {driftSound ? (
              <>
                <Volume2 className="size-4 text-violet-600" /> Drift Noise ON
              </>
            ) : (
              <>
                <VolumeX className="size-4 text-slate-400" /> Drift Noise Muted
              </>
            )}
          </button>
        }
      />

      {/* Alarm ringing state */}
      {phase === "alarm" && (
        <Card className="p-8 text-center sm:p-12 border-violet-400 bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-2xl animate-pulse">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-violet-600 text-white shadow-xl shadow-violet-500/30">
            <AlarmClock className="size-10 animate-bounce" />
          </div>
          <h2 className="mt-6 text-3xl font-black text-slate-900">
            Wake Up, Scholar! ☀️
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            Your power nap has finished. The chime is playing softly so you wake up smoothly without sleep inertia.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              variant="primary"
              className="px-8 text-base shadow-lg"
              onClick={handleStopAlarm}
            >
              <AlarmClockOff className="size-5" /> Stop Alarm & Complete
            </Button>
          </div>
        </Card>
      )}

      {/* Completed state */}
      {phase === "completed" && (
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Power Nap Completed!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Adenosine has been cleared from your brain receptors. Here is your 2-minute wake protocol:
          </p>

          {/* Wake-up checklist */}
          <div className="mx-auto mt-6 grid max-w-lg gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
              <Droplet className="size-5 text-sky-600 mb-1" />
              <p className="text-xs font-bold text-sky-950">1. Drink Water</p>
              <p className="text-[11px] text-sky-700">Re-hydrates your brain tissue immediately.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
              <Sun className="size-5 text-amber-600 mb-1" />
              <p className="text-xs font-bold text-amber-950">2. View Bright Light</p>
              <p className="text-[11px] text-amber-700">Signals suprachiasmatic nucleus to reset alertness.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
              <Zap className="size-5 text-emerald-600 mb-1" />
              <p className="text-xs font-bold text-emerald-950">3. Roll Shoulders</p>
              <p className="text-[11px] text-emerald-700">Stimulates sympathetic neural tone.</p>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Alertness Check
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Before Nap
                </label>
                <div className="flex gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMoodBefore(m)}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-bold transition cursor-pointer",
                        moodBefore === m
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{MOOD_LABELS[moodBefore - 1]}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  After Nap
                </label>
                <div className="flex gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMoodAfter(m)}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-bold transition cursor-pointer",
                        moodAfter === m
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">{MOOD_LABELS[moodAfter - 1]}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1"
                variant="success"
                loading={saving}
                onClick={handleSaveSession}
              >
                <Sparkles className="size-4" /> Save Nap to History
              </Button>
              <Button variant="secondary" onClick={() => setPhase("idle")}>
                Done
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Active or Idle State */}
      {phase !== "alarm" && phase !== "completed" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main timer display */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 sm:p-8 flex flex-col items-center text-center">
              {/* Status pill */}
              <div className="mb-4">
                {phase === "idle" && (
                  <Badge color="slate">Ready to Sleep</Badge>
                )}
                {phase === "buffer" && (
                  <Badge color="amber">Drifting Off to Sleep ({selectedBuffer}m buffer)</Badge>
                )}
                {phase === "napping" && (
                  <Badge color="violet">Power Nap in Progress</Badge>
                )}
              </div>

              {/* Circular Timer Display */}
              <div className="relative flex size-60 items-center justify-center my-2">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-slate-100"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-violet-600 transition-all duration-1000 ease-linear"
                    strokeWidth="5"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {formatTime(secondsRemaining)}
                  </span>
                  <span className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {phase === "buffer"
                      ? "Buffer Falling Asleep"
                      : phase === "napping"
                      ? "Resting"
                      : `${selectedDuration}m Nap + ${selectedBuffer}m Buffer`}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center gap-3">
                {phase === "idle" ? (
                  <Button
                    size="lg"
                    variant="primary"
                    className="min-w-[160px] bg-slate-900 hover:bg-slate-800"
                    onClick={handleStartNap}
                  >
                    <Bed className="size-5" /> Start Power Nap
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handleCancel}
                  >
                    Cancel Nap
                  </Button>
                )}
              </div>
            </Card>

            {/* Presets if idle */}
            {phase === "idle" && (
              <Card className="p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Scientifically Calibrated Nap Presets
                </h3>
                <div className="space-y-3">
                  {NAP_PRESETS.map((p) => (
                    <button
                      key={p.duration}
                      onClick={() => setSelectedDuration(p.duration)}
                      className={cn(
                        "w-full flex items-start justify-between rounded-2xl border p-4 text-left transition cursor-pointer",
                        selectedDuration === p.duration
                          ? "border-violet-500 bg-violet-50/50 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{p.title}</h4>
                          <Badge color="violet">{p.tag}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{p.desc}</p>
                      </div>
                      <span className="text-base font-black text-violet-700">{p.duration}m</span>
                    </button>
                  ))}
                </div>

                {/* Fall-asleep buffer option */}
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <span className="text-xs font-bold text-slate-500">Fall-asleep buffer time:</span>
                  <div className="mt-2 flex gap-2">
                    {BUFFERS.map((b) => (
                      <button
                        key={b.min}
                        onClick={() => setSelectedBuffer(b.min)}
                        className={cn(
                          "flex-1 rounded-xl border py-2 text-xs font-bold transition cursor-pointer",
                          selectedBuffer === b.min
                            ? "border-violet-400 bg-violet-50 text-violet-700"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right column: Science & Sleep Hygiene */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 border-violet-100 bg-gradient-to-br from-violet-50/60 to-slate-50">
              <div className="flex items-center gap-2 text-violet-700">
                <Brain className="size-5" />
                <h3 className="text-sm font-extrabold">The Neuroscience of the 20-Min Nap</h3>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                While you study, the chemical <strong>adenosine</strong> binds to receptors in your brain, creating sleep pressure and mental sludge.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                A 20-minute nap flushes adenosine without dipping into slow-wave Stage 3 deep sleep—meaning you wake up sharp rather than groggy.
              </p>
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Nap Success Tips
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>Darkness:</strong> Pull down blinds or pull a hoodie over your eyes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>Don't stress sleep:</strong> Even lying with eyes closed in silence provides 70% of the cognitive recovery benefit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">•</span>
                  <span><strong>The "Nappuccino" hack:</strong> Drink a quick espresso right before napping. Caffeine takes 20 mins to absorb, kicking in precisely as your alarm sounds!</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
