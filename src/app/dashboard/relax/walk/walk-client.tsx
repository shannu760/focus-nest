"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Footprints,
  Leaf,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { relaxAudio } from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

const DURATIONS = [5, 10, 15, 20, 30];

const CADENCES = [
  { id: "slow", label: "Grounded & Slow", spm: 60, desc: "1 step per second. Maximum mindfulness." },
  { id: "normal", label: "Mindful Stroll", spm: 80, desc: "Gentle natural pace. Clears brain fog." },
  { id: "brisk", label: "Brisk Refresh", spm: 100, desc: "Invigorating walk. Boosts dopamine & BDNF." },
];

const MINDFUL_PROMPTS = [
  {
    category: "Sight (Notice 5 things)",
    icon: "👁️",
    text: "Scan your surroundings. Look for 5 specific shapes, light reflections, or textures you normally overlook.",
  },
  {
    category: "Physical Contact (Notice 4 sensations)",
    icon: "👣",
    text: "Pay attention to the roll of your foot from heel to toe. Feel the ground beneath you and the air against your face.",
  },
  {
    category: "Sound (Listen for 3 layers)",
    icon: "👂",
    text: "Listen past immediate foreground sounds. Can you hear the subtle rustle of trees, distant bird calls, or your own breath?",
  },
  {
    category: "Scent & Fresh Air (Notice 2 aromas)",
    icon: "🍃",
    text: "Take a slow, deep breath through your nose. Notice the temperature of the air, fresh grass, or rainfall.",
  },
  {
    category: "Body Gratitude (1 thought)",
    icon: "✨",
    text: "Bring to mind one thing you are genuinely thankful for today, even amidst exam pressure.",
  },
];

const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Exhausted", "Anxious", "Neutral", "Refreshed", "Empowered"];

export function WalkClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedMin, setSelectedMin] = useState(20);
  const [selectedCadence, setSelectedCadence] = useState(CADENCES[1]);
  const [soundEnabled, setSoundEnabled] = useState(false); // Tick off by default, optional
  const [isRunning, setIsRunning] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const [moodBefore, setMoodBefore] = useState(2);
  const [moodAfter, setMoodAfter] = useState(5);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pacerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = selectedMin * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  // Main timer
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        // Rotate prompts every 90 seconds
        if (next % 90 === 0) {
          setPromptIndex((idx) => (idx + 1) % MINDFUL_PROMPTS.length);
        }

        if (next >= totalSeconds) {
          setIsRunning(false);
          setIsCompleted(true);
          if (relaxAudio) relaxAudio.playChime(528, 3.5);
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, totalSeconds]);

  // Audio Pacer tick
  useEffect(() => {
    if (!isRunning || !soundEnabled) {
      if (pacerRef.current) clearInterval(pacerRef.current);
      return;
    }

    const intervalMs = (60 / selectedCadence.spm) * 1000;
    pacerRef.current = setInterval(() => {
      if (relaxAudio) {
        relaxAudio.playPacerTick();
      }
    }, intervalMs);

    return () => {
      if (pacerRef.current) clearInterval(pacerRef.current);
    };
  }, [isRunning, soundEnabled, selectedCadence.spm]);

  const estimatedSteps = Math.round((elapsedSeconds / 60) * selectedCadence.spm);
  const estimatedKm = (estimatedSteps * 0.00075).toFixed(2);
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  function formatTime(s: number) {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleSaveSession() {
    setSaving(true);
    const actualMin = Math.max(1, Math.round(elapsedSeconds / 60));
    try {
      await api("/api/relax", {
        method: "POST",
        body: JSON.stringify({
          activityType: "walk",
          title: `Mindful Walk (${actualMin} min · ~${estimatedSteps} steps)`,
          durationMin: actualMin,
          moodBefore,
          moodAfter,
        }),
      });
      toast({
        title: "Mindful walk logged! 🚶",
        description: `Logged ${actualMin} min outdoor recovery (+${moodAfter - moodBefore} mood boost).`,
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

  function handleReset() {
    setIsRunning(false);
    setElapsedSeconds(0);
    setIsCompleted(false);
  }

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
        title="Mindful Walk Companion"
        subtitle="No screen, no exam thoughts. Step outside, ground your senses, and let neurochemicals reset."
        action={
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            title={soundEnabled ? "Mute cadence audio tick" : "Enable cadence tick"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="size-4 text-emerald-600" /> Cadence Tick ON
              </>
            ) : (
              <>
                <VolumeX className="size-4 text-slate-400" /> Cadence Tick Muted
              </>
            )}
          </button>
        }
      />

      {isCompleted ? (
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Mindful Walk Complete!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You completed {Math.round(elapsedSeconds / 60)} minutes and roughly ~{estimatedSteps} mindful steps.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-100 bg-slate-50/70 p-6 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mood Check-in
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Mood Before
                </label>
                <div className="flex gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMoodBefore(m)}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-bold transition cursor-pointer",
                        moodBefore === m
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
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
                  Mood After
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
                onClick={handleSaveSession}
              >
                <Sparkles className="size-4" /> Save Walk to History
              </Button>
              <Button
                variant="secondary"
                onClick={handleReset}
              >
                <RotateCcw className="size-4" /> Walk More
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main timer & tracker */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-6 sm:p-8 flex flex-col items-center text-center">
              {/* Duration selector */}
              {!isRunning && elapsedSeconds === 0 && (
                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-2">Target Time:</span>
                  {DURATIONS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMin(m)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                        selectedMin === m
                          ? "border-lime-500 bg-lime-50 text-lime-800 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              )}

              {/* Progress Ring with Animated Pacer */}
              <div className="relative flex size-56 items-center justify-center my-2">
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-dashed border-lime-300 transition-transform duration-700",
                    isRunning && "animate-spin"
                  )}
                  style={{ animationDuration: "16s" }}
                />
                <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-slate-100"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    className="stroke-lime-500 transition-all duration-500 ease-linear"
                    strokeWidth="6"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {formatTime(remainingSeconds)}
                  </span>
                  <span className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isRunning ? "Walking Mindfully" : "Time Remaining"}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-6 grid w-full grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div>
                  <p className="text-lg font-extrabold text-slate-900">~{estimatedSteps}</p>
                  <p className="text-[11px] font-semibold text-slate-500">Est. Steps</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900">{estimatedKm} km</p>
                  <p className="text-[11px] font-semibold text-slate-500">Distance</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-900">{Math.floor(elapsedSeconds / 60)} min</p>
                  <p className="text-[11px] font-semibold text-slate-500">Elapsed</p>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  size="lg"
                  variant={isRunning ? "secondary" : "primary"}
                  className="min-w-[140px]"
                  onClick={() => {
                    if (!isRunning && relaxAudio) {
                      relaxAudio.playChime(440, 1.2);
                    }
                    setIsRunning((r) => !r);
                  }}
                >
                  {isRunning ? (
                    <>
                      <Pause className="size-5" /> Pause Walk
                    </>
                  ) : (
                    <>
                      <Play className="size-5" /> Start Walk
                    </>
                  )}
                </Button>

                {elapsedSeconds > 30 && (
                  <Button
                    size="lg"
                    variant="success"
                    onClick={() => {
                      setIsRunning(false);
                      setIsCompleted(true);
                    }}
                  >
                    Finish & Log
                  </Button>
                )}

                {elapsedSeconds > 0 && !isRunning && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={handleReset}
                  >
                    <RotateCcw className="size-4" /> Reset
                  </Button>
                )}
              </div>
            </Card>

            {/* Cadence selection */}
            <Card className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Walking Cadence & Pacing
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {CADENCES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCadence(c)}
                    className={cn(
                      "rounded-xl border p-3.5 text-left transition cursor-pointer",
                      selectedCadence.id === c.id
                        ? "border-lime-500 bg-lime-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <p className="text-xs font-bold text-slate-900">{c.label}</p>
                    <p className="text-[11px] font-semibold text-lime-700">{c.spm} steps/min</p>
                    <p className="mt-1 text-[11px] text-slate-500 leading-tight">{c.desc}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Side column: Sensory Grounding & Prompts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Sensory Prompt */}
            <Card className="p-6 border-lime-200 bg-gradient-to-br from-lime-50/50 to-emerald-50/40">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{MINDFUL_PROMPTS[promptIndex].icon}</span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lime-800">
                    5-4-3-2-1 Sensory Focus
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {MINDFUL_PROMPTS[promptIndex].category}
                  </h3>
                </div>
              </div>
              <p className="mt-3.5 text-sm leading-relaxed text-slate-700 font-medium">
                {MINDFUL_PROMPTS[promptIndex].text}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-lime-200/60 pt-4">
                <span className="text-xs text-slate-500">
                  Prompt {promptIndex + 1} of {MINDFUL_PROMPTS.length}
                </span>
                <button
                  onClick={() => setPromptIndex((i) => (i + 1) % MINDFUL_PROMPTS.length)}
                  className="text-xs font-bold text-lime-700 hover:text-lime-900 cursor-pointer"
                >
                  Next prompt →
                </button>
              </div>
            </Card>

            {/* Why Walking Works */}
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Leaf className="size-4 text-emerald-600" />
                Why a 20-min walk restores focus
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Optic flow:</strong> Visual motion of trees and horizon lowers amygdala panic activity.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Default Mode Network:</strong> Unfocused walking lets your brain passively integrate concepts studied in previous hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span><strong>Cortisol clearance:</strong> Gentle aerobic movement flushes study stress hormones naturally.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
