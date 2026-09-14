"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  MonitorOff,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { relaxAudio } from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

const EYE_EXERCISES = [
  {
    id: 1,
    title: "Infinity Figure-8 Smooth Pursuit",
    duration: 45,
    cue: "Keep your head perfectly still. Smoothly track the glowing orb with your eyes only.",
    details: "Stretches all 6 extraocular muscles, preventing ocular muscle spasms from stationary screen fixation.",
  },
  {
    id: 2,
    title: "Near-to-Far Accommodation Shift",
    duration: 45,
    cue: "Look at your thumb 10 inches away for 3 seconds, then look past it at a distant wall for 3 seconds.",
    details: "Exercises the ciliary ring muscles that flex and flatten the eye's crystalline lens.",
  },
  {
    id: 3,
    title: "Conscious Hydration Blinking",
    duration: 30,
    cue: "Close your eyes fully, squeeze gently for 1 second, then open. Repeat deliberately every 3 seconds.",
    details: "When staring at monitors, blink rates drop by 60%. This re-distributes the essential lipid tear film.",
  },
  {
    id: 4,
    title: "Palming & Total Darkness Therapy",
    duration: 60,
    cue: "Rub your palms together until warm. Cup them gently over your closed eyes without pressing the eyeballs.",
    details: "Complete darkness and thermal warmth prompt deep parasympathetic relaxation of optic nerves.",
  },
  {
    id: 5,
    title: "Brow & Temple Tension Release",
    duration: 60,
    cue: "Use two fingers to make small, gentle circles across your temples and along your brow bone.",
    details: "Disperses tension headaches and squinting strain accumulated over hours of exam prep.",
  },
];

const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Strained", "Fatigued", "Neutral", "Refreshed", "Clear-Eyed"];

export function ScreenBreakClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = useState<"quick" | "guided">("quick");
  const [warmMode, setWarmMode] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Quick 20-20-20 state
  const [quickSecondsLeft, setQuickSecondsLeft] = useState(20);
  const [quickRunning, setQuickRunning] = useState(false);
  const [quickCompleted, setQuickCompleted] = useState(false);

  // Guided Routine state
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [guidedSecondsLeft, setGuidedSecondsLeft] = useState(EYE_EXERCISES[0].duration);
  const [guidedRunning, setGuidedRunning] = useState(false);
  const [guidedCompleted, setGuidedCompleted] = useState(false);

  // Infinity tracking animation angle
  const [orbitAngle, setOrbitAngle] = useState(0);

  // Mood logging
  const [moodBefore, setMoodBefore] = useState(2);
  const [moodAfter, setMoodAfter] = useState(4);
  const [saving, setSaving] = useState(false);

  const quickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const guidedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Quick 20s timer
  useEffect(() => {
    if (!quickRunning) {
      if (quickTimerRef.current) clearInterval(quickTimerRef.current);
      return;
    }

    quickTimerRef.current = setInterval(() => {
      setQuickSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        setQuickRunning(false);
        setQuickCompleted(true);
        if (soundEnabled && relaxAudio) relaxAudio.playChime(659.25, 3);
        return 0;
      });
    }, 1000);

    return () => {
      if (quickTimerRef.current) clearInterval(quickTimerRef.current);
    };
  }, [quickRunning, soundEnabled]);

  // Guided exercise timer
  useEffect(() => {
    if (!guidedRunning) {
      if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);
      return;
    }

    guidedTimerRef.current = setInterval(() => {
      setGuidedSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (soundEnabled && relaxAudio) relaxAudio.playChime(587.33, 2);

        if (exerciseIndex < EYE_EXERCISES.length - 1) {
          setExerciseIndex((i) => i + 1);
          return EYE_EXERCISES[exerciseIndex + 1].duration;
        } else {
          setGuidedRunning(false);
          setGuidedCompleted(true);
          return 0;
        }
      });
    }, 1000);

    return () => {
      if (guidedTimerRef.current) clearInterval(guidedTimerRef.current);
    };
  }, [guidedRunning, exerciseIndex, soundEnabled]);

  // Sync guided timer when index changes
  useEffect(() => {
    setGuidedSecondsLeft(EYE_EXERCISES[exerciseIndex].duration);
  }, [exerciseIndex]);

  // Smooth Infinity 8 animation loop
  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle += 0.025;
      setOrbitAngle(angle);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Lemniscate of Bernoulli (Figure-8) coordinates
  const a = 110;
  const sinT = Math.sin(orbitAngle);
  const cosT = Math.cos(orbitAngle);
  const denom = 1 + sinT * sinT;
  const x8 = (a * cosT) / denom;
  const y8 = (a * sinT * cosT) / denom;

  async function handleSaveSession(title: string, durationMin: number) {
    setSaving(true);
    try {
      await api("/api/relax", {
        method: "POST",
        body: JSON.stringify({
          activityType: "screen-break",
          title,
          durationMin: Math.max(1, durationMin),
          moodBefore,
          moodAfter,
        }),
      });
      toast({
        title: "Eye break logged! 🌇",
        description: `Your eyes thank you (+${moodAfter - moodBefore} mood boost).`,
        kind: "success",
      });
      router.push("/dashboard/relax");
    } catch (e) {
      toast({
        title: "Could not save break",
        description: e instanceof Error ? e.message : "Please try again.",
        kind: "error",
      });
      setSaving(false);
    }
  }

  const isAnyCompleted = mode === "quick" ? quickCompleted : guidedCompleted;

  return (
    <div
      className={cn(
        "mx-auto max-w-4xl transition-colors duration-500 rounded-3xl p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out] pb-12",
        warmMode
          ? "bg-gradient-to-b from-amber-50/50 via-orange-50/20 to-white"
          : "bg-white"
      )}
    >
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
        title="Screen Sunset & Eye Recovery"
        subtitle="Counter digital eye strain, dryness, and blur from hours of monitor exposure."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWarmMode((w) => !w)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer",
                warmMode
                  ? "border-amber-300 bg-amber-100/70 text-amber-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              <Sun className="size-3.5 text-amber-500" />
              {warmMode ? "Sunset Tint ON" : "Normal Mode"}
            </button>
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="size-3.5 text-emerald-600" />
              ) : (
                <VolumeX className="size-3.5 text-slate-400" />
              )}
            </button>
          </div>
        }
      />

      {/* Mode Selector Tabs */}
      {!isAnyCompleted && (
        <div className="mb-6 flex gap-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setMode("quick")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer",
              mode === "quick"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Eye className="size-4" /> Quick 20-20-20 Reset (20s)
          </button>
          <button
            onClick={() => setMode("guided")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer",
              mode === "guided"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Sparkles className="size-4" /> 4-Minute Complete Eye Workout
          </button>
        </div>
      )}

      {/* Completion View */}
      {isAnyCompleted ? (
        <Card className="p-8 text-center sm:p-12 border-amber-200 bg-amber-50/40">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-inner">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Eye Recovery Complete!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Your ciliary muscles have relaxed and tear film has been restored.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-amber-100 bg-white p-6 text-left shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mood & Strain Check
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Strain Before
                </label>
                <div className="flex gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMoodBefore(m)}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-bold transition cursor-pointer",
                        moodBefore === m
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
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
                  Feeling After
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
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
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
                onClick={() =>
                  handleSaveSession(
                    mode === "quick" ? "20-20-20 Screen Sunset" : "Guided 4-Min Eye Workout",
                    mode === "quick" ? 2 : 4
                  )
                }
              >
                <Sparkles className="size-4" /> Save Eye Break
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuickCompleted(false);
                  setQuickSecondsLeft(20);
                  setGuidedCompleted(false);
                  setGuidedSecondsLeft(EYE_EXERCISES[0].duration);
                  setExerciseIndex(0);
                }}
              >
                <RotateCcw className="size-4" /> Repeat
              </Button>
            </div>
          </div>
        </Card>
      ) : mode === "quick" ? (
        /* Quick 20-20-20 View */
        <Card className="p-8 text-center sm:p-12 border-amber-100 bg-white">
          <Badge color="amber" className="mb-4">
            Optometric 20-20-20 Rule
          </Badge>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Look at an object 20 feet away for 20 seconds
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 leading-relaxed">
            Look out your window at trees, clouds, or the furthest opposite wall.
            Allow your eyes to relax completely without focusing on any text.
          </p>

          {/* Infinity Visual Horizon Pacer */}
          <div className="relative mx-auto my-8 flex size-56 items-center justify-center">
            <div
              className={cn(
                "absolute inset-0 rounded-full border-4 border-dashed border-amber-200",
                quickRunning && "animate-spin"
              )}
              style={{ animationDuration: "20s" }}
            />
            <div
              className={cn(
                "absolute rounded-full bg-gradient-to-br from-amber-400 to-orange-500 blur-sm transition-all duration-1000",
                quickRunning ? "size-28 opacity-80" : "size-16 opacity-40"
              )}
            />
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {quickSecondsLeft}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                {quickRunning ? "Look 20ft Away" : "Ready"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              size="lg"
              variant={quickRunning ? "secondary" : "primary"}
              className="min-w-[150px]"
              onClick={() => {
                if (!quickRunning && soundEnabled && relaxAudio) {
                  relaxAudio.playChime(528, 1);
                }
                setQuickRunning((r) => !r);
              }}
            >
              {quickRunning ? (
                <>
                  <Pause className="size-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="size-4" /> Start 20s Reset
                </>
              )}
            </Button>
            {quickSecondsLeft < 20 && !quickRunning && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuickSecondsLeft(20);
                  setQuickRunning(false);
                }}
              >
                <RotateCcw className="size-4" /> Reset
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* Guided 4-Minute Workout View */
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Exercise {exerciseIndex + 1} of {EYE_EXERCISES.length}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {EYE_EXERCISES[exerciseIndex].title}
                </h2>
              </div>
              <Badge color="amber">{guidedSecondsLeft}s left</Badge>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Guidance column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Action Cue
                  </p>
                  <p className="mt-1 text-sm font-bold text-amber-950">
                    {EYE_EXERCISES[exerciseIndex].cue}
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {EYE_EXERCISES[exerciseIndex].details}
                </p>
              </div>

              {/* Visual Tracker Display (Figure 8 or Circular) */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative flex size-52 items-center justify-center rounded-2xl bg-slate-900 overflow-hidden shadow-inner">
                  {/* Subtle infinity track lines */}
                  <svg className="absolute inset-0 size-full opacity-20" viewBox="-120 -60 240 120">
                    <path
                      d="M -100 0 C -100 -50, 0 -50, 0 0 C 0 50, 100 50, 100 0 C 100 -50, 0 -50, 0 0 C 0 50, -100 50, -100 0"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Moving Eye-tracking orb */}
                  <div
                    className="absolute size-5 rounded-full bg-amber-400 shadow-[0_0_15px_#f59e0b] transition-transform duration-75 ease-linear"
                    style={{
                      transform: `translate(${x8}px, ${y8}px)`,
                    }}
                  />

                  {/* Central countdown */}
                  <div className="pointer-events-none text-center">
                    <span className="text-3xl font-extrabold text-white">
                      {guidedSecondsLeft}
                    </span>
                    <p className="text-[10px] font-semibold uppercase text-amber-300">
                      Follow the dot
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Button
                    size="md"
                    variant={guidedRunning ? "secondary" : "primary"}
                    className="min-w-[130px]"
                    onClick={() => {
                      if (!guidedRunning && soundEnabled && relaxAudio) {
                        relaxAudio.playChime(440, 1);
                      }
                      setGuidedRunning((r) => !r);
                    }}
                  >
                    {guidedRunning ? (
                      <>
                        <Pause className="size-4" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-4" /> Start Exercise
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stepper footer */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
              <Button
                variant="ghost"
                size="sm"
                disabled={exerciseIndex === 0}
                onClick={() => setExerciseIndex((i) => i - 1)}
              >
                Previous
              </Button>
              <div className="flex gap-1.5">
                {EYE_EXERCISES.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "size-2 rounded-full",
                      i === exerciseIndex
                        ? "w-6 bg-amber-500"
                        : i < exerciseIndex
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (exerciseIndex < EYE_EXERCISES.length - 1) {
                    setExerciseIndex((i) => i + 1);
                  } else {
                    setGuidedRunning(false);
                    setGuidedCompleted(true);
                  }
                }}
              >
                {exerciseIndex === EYE_EXERCISES.length - 1 ? "Complete" : "Next"} <ChevronRight className="size-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
