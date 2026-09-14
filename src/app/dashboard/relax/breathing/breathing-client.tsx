"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  HeartPulse,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { relaxAudio } from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

type BreathPhase = "inhale" | "holdIn" | "exhale" | "holdOut";

interface BreathTechnique {
  id: string;
  name: string;
  desc: string;
  phases: { phase: BreathPhase; duration: number; text: string }[];
  totalSecsPerCycle: number;
}

const TECHNIQUES: BreathTechnique[] = [
  {
    id: "box",
    name: "Box Breathing (4-4-4-4)",
    desc: "Navy SEAL protocol to rapidly deactivate panic and reset the parasympathetic nervous system.",
    phases: [
      { phase: "inhale", duration: 4, text: "Inhale slowly through your nose" },
      { phase: "holdIn", duration: 4, text: "Hold breath gently" },
      { phase: "exhale", duration: 4, text: "Exhale smoothly through mouth" },
      { phase: "holdOut", duration: 4, text: "Hold lungs empty" },
    ],
    totalSecsPerCycle: 16,
  },
  {
    id: "478",
    name: "4-7-8 Relaxing Breath",
    desc: "Dr. Andrew Weil's natural tranquilizer for the nervous system. Calms racing exam anxiety.",
    phases: [
      { phase: "inhale", duration: 4, text: "Inhale quietly through nose" },
      { phase: "holdIn", duration: 7, text: "Hold breath comfortably" },
      { phase: "exhale", duration: 8, text: "Whoosh exhale completely through mouth" },
    ],
    totalSecsPerCycle: 19,
  },
  {
    id: "coherence",
    name: "Resonant Coherence (5.5s - 5.5s)",
    desc: "Breathe at 5.5 breaths per minute to synchronize heart rate variability (HRV) with brainwaves.",
    phases: [
      { phase: "inhale", duration: 5, text: "Deep nasal inhale expanding diaphragm" },
      { phase: "exhale", duration: 6, text: "Smooth relaxed exhale" },
    ],
    totalSecsPerCycle: 11,
  },
];

const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Panicked", "Tense", "Neutral", "Calm", "Centered"];

export function BreathingClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedTech, setSelectedTech] = useState(TECHNIQUES[0]);
  const [targetCycles, setTargetCycles] = useState(8);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [phaseIndex, setPhaseIndex] = useState(0);

  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(selectedTech.phases[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const [moodBefore, setMoodBefore] = useState(2);
  const [moodAfter, setMoodAfter] = useState(5);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhaseConfig = selectedTech.phases[phaseIndex];

  // Reset when technique changes
  useEffect(() => {
    setIsRunning(false);
    setCurrentCycle(1);
    setPhaseIndex(0);
    setPhaseSecondsLeft(selectedTech.phases[0].duration);
    setIsCompleted(false);
  }, [selectedTech]);

  // Main countdown loop
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition to next phase
        const nextPhaseIdx = (phaseIndex + 1) % selectedTech.phases.length;

        // Play subtle breath transition tone
        if (soundEnabled && relaxAudio) {
          const freq =
            selectedTech.phases[nextPhaseIdx].phase === "inhale"
              ? 528
              : selectedTech.phases[nextPhaseIdx].phase === "exhale"
              ? 396
              : 440;
          relaxAudio.playChime(freq, 1.2);
        }

        // Did we finish a full cycle?
        if (nextPhaseIdx === 0) {
          if (currentCycle >= targetCycles) {
            setIsRunning(false);
            setIsCompleted(true);
            if (relaxAudio) relaxAudio.playChime(587.33, 3);
            return 0;
          } else {
            setCurrentCycle((c) => c + 1);
          }
        }

        setPhaseIndex(nextPhaseIdx);
        return selectedTech.phases[nextPhaseIdx].duration;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phaseIndex, selectedTech, currentCycle, targetCycles, soundEnabled]);

  async function handleSaveSession() {
    setSaving(true);
    const durationMin = Math.max(1, Math.round((currentCycle * selectedTech.totalSecsPerCycle) / 60));
    try {
      await api("/api/relax", {
        method: "POST",
        body: JSON.stringify({
          activityType: "breathing",
          title: `${selectedTech.name} (${currentCycle} cycles)`,
          durationMin,
          moodBefore,
          moodAfter,
        }),
      });
      toast({
        title: "Breathing session saved! 🌬️",
        description: `Heart rate & nervous system centered (+${moodAfter - moodBefore} calm boost).`,
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
    setCurrentCycle(1);
    setPhaseIndex(0);
    setPhaseSecondsLeft(selectedTech.phases[0].duration);
    setIsCompleted(false);
  }

  // Animation scaling
  const isExpanding = currentPhaseConfig.phase === "inhale";
  const isHolding = currentPhaseConfig.phase === "holdIn" || currentPhaseConfig.phase === "holdOut";
  const isContracting = currentPhaseConfig.phase === "exhale";

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
        title="Breathing Studio"
        subtitle="Slow, rhythmic respiration stimulates the vagus nerve, immediately braking high heart rates."
        action={
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="size-4 text-sky-600" /> Breath Tones ON
              </>
            ) : (
              <>
                <VolumeX className="size-4 text-slate-400" /> Tones Muted
              </>
            )}
          </button>
        }
      />

      {isCompleted ? (
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-inner">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Breathing Session Complete!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You completed {targetCycles} cycles of {selectedTech.name}. Your vagus nerve is stimulated and heart rate decelerated.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Check-in
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Anxiety Before
                </label>
                <div className="flex gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMoodBefore(m)}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-bold transition cursor-pointer",
                        moodBefore === m
                          ? "border-sky-400 bg-sky-50 text-sky-700"
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
                  Calm After
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
                <Sparkles className="size-4" /> Save Breathing Break
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="size-4" /> Repeat
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Interactive Breathing Orb */}
          <div className="lg:col-span-8">
            <Card className="p-8 sm:p-12 flex flex-col items-center justify-center text-center overflow-hidden">
              <div className="mb-4 flex items-center gap-3">
                <Badge color="sky">
                  Cycle {currentCycle} of {targetCycles}
                </Badge>
                <Badge color="slate">{selectedTech.name}</Badge>
              </div>

              {/* Expanding & Contracting Glowing Orb */}
              <div className="relative flex size-72 items-center justify-center my-6">
                {/* Outer halo */}
                <div
                  className={cn(
                    "absolute rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/20 blur-xl transition-all ease-in-out",
                    isExpanding && "size-72 opacity-90 duration-[4000ms]",
                    isHolding && "size-64 opacity-75 duration-500",
                    isContracting && "size-40 opacity-40 duration-[4000ms]",
                    !isRunning && "size-48 opacity-50"
                  )}
                />

                {/* Inner glowing core */}
                <div
                  className={cn(
                    "absolute rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-2xl transition-all ease-in-out flex items-center justify-center",
                    isExpanding && "size-60 shadow-sky-400/50 duration-[4000ms]",
                    isHolding && "size-56 shadow-sky-300/40 duration-500",
                    isContracting && "size-32 shadow-blue-500/20 duration-[4000ms]",
                    !isRunning && "size-44 shadow-sky-400/30"
                  )}
                >
                  <div className="text-white text-center select-none">
                    <p className="text-4xl font-black tracking-tight">
                      {isRunning ? phaseSecondsLeft : "Ready"}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest text-sky-100 mt-0.5">
                      {isRunning
                        ? currentPhaseConfig.phase === "inhale"
                          ? "Inhale"
                          : currentPhaseConfig.phase === "exhale"
                          ? "Exhale"
                          : "Hold"
                        : "Press Start"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions text */}
              <p className="text-base font-bold text-slate-800 max-w-sm">
                {isRunning ? currentPhaseConfig.text : "Sit upright, relax your jaw and shoulders."}
              </p>

              {/* Controls */}
              <div className="mt-8 flex items-center gap-3">
                <Button
                  size="lg"
                  variant={isRunning ? "secondary" : "primary"}
                  className="min-w-[150px]"
                  onClick={() => {
                    if (!isRunning && soundEnabled && relaxAudio) {
                      relaxAudio.playChime(528, 1);
                    }
                    setIsRunning((r) => !r);
                  }}
                >
                  {isRunning ? (
                    <>
                      <Pause className="size-5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="size-5" /> Start Breathing
                    </>
                  )}
                </Button>

                {currentCycle > 1 && (
                  <Button
                    size="lg"
                    variant="success"
                    onClick={() => {
                      setIsRunning(false);
                      setIsCompleted(true);
                    }}
                  >
                    Finish Session
                  </Button>
                )}

                {isRunning && (
                  <Button variant="ghost" size="lg" onClick={handleReset}>
                    <RotateCcw className="size-4" /> Reset
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Side column: Techniques & Options */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Select Respiration Method
              </h3>
              <div className="space-y-2.5">
                {TECHNIQUES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTech(t)}
                    className={cn(
                      "w-full rounded-xl border p-3.5 text-left transition cursor-pointer",
                      selectedTech.id === t.id
                        ? "border-sky-500 bg-sky-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <p className="text-xs font-extrabold text-slate-900">{t.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">{t.desc}</p>
                  </button>
                ))}
              </div>

              {/* Target cycles */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Session Target Cycles:
                </label>
                <div className="flex gap-2">
                  {[4, 8, 12, 16].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTargetCycles(c)}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-xs font-bold transition cursor-pointer",
                        targetCycles === c
                          ? "border-sky-500 bg-sky-50 text-sky-700"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="p-5 border-sky-100 bg-sky-50/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                <HeartPulse className="size-4" /> Vagus Nerve Activation
              </h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                When you make your exhale longer than your inhale, baroreceptors send a signal to your brainstem to release acetylcholine, naturally dropping your systolic blood pressure and stopping panic tremors.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
