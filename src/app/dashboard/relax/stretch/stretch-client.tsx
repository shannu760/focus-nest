"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  PersonStanding,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { relaxAudio } from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

interface StretchPose {
  id: number;
  name: string;
  duration: number; // seconds
  targetMuscles: string[];
  instructions: string[];
  cue: string;
  iconBg: string;
}

const POSES: StretchPose[] = [
  {
    id: 1,
    name: "Chin Tucks & Gentle Neck Rolls",
    duration: 45,
    targetMuscles: ["Cervical Spine", "Suboccipitals"],
    instructions: [
      "Sit up straight with your shoulders relaxed.",
      "Draw your chin straight backward as if making a gentle double chin.",
      "Hold for 3 seconds, release, then roll your head slowly ear-to-shoulder.",
      "Never crank backward; keep all motions fluid and painless.",
    ],
    cue: "Feel the back of your neck gently elongating.",
    iconBg: "from-sky-500 to-blue-600",
  },
  {
    id: 2,
    name: "Shoulder Shrugs & Deep Backward Rolls",
    duration: 60,
    targetMuscles: ["Upper Trapezius", "Levator Scapulae"],
    instructions: [
      "Inhale deeply while lifting both shoulders straight up toward your ears.",
      "Hold at the top for 2 seconds with light engagement.",
      "Exhale and roll your shoulders back, squeezing your shoulder blades together.",
      "Let them drop completely before beginning the next slow circle.",
    ],
    cue: "Exhale all the tension you carry in your shoulders.",
    iconBg: "from-indigo-500 to-violet-600",
  },
  {
    id: 3,
    name: "Chest Opener & Clasp",
    duration: 60,
    targetMuscles: ["Pectoralis Major", "Anterior Deltoids"],
    instructions: [
      "Interlace your fingers behind your lower back (or hold a towel).",
      "Roll your shoulders back and gently draw your shoulder blades together.",
      "Lift your chest toward the ceiling while maintaining a neutral neck.",
      "Inhale into the ribs, feeling the front of your body expand.",
    ],
    cue: "Reverse hours of laptop and textbook hunching.",
    iconBg: "from-emerald-500 to-teal-600",
  },
  {
    id: 4,
    name: "Seated Spinal Twist",
    duration: 50,
    targetMuscles: ["Thoracic Spine", "Obliques", "Erector Spinae"],
    instructions: [
      "Sit tall with both feet flat on the ground.",
      "Place your right hand on your left knee and left hand on your chair back.",
      "Inhale to lengthen your spine; exhale to rotate gently to the left.",
      "Halfway through, switch sides smoothly.",
    ],
    cue: "Rotate from the mid-back, not by forcing the neck.",
    iconBg: "from-amber-500 to-orange-600",
  },
  {
    id: 5,
    name: "Upper Trap & Side Neck Elongation",
    duration: 50,
    targetMuscles: ["Upper Trapezius", "Scalenes"],
    instructions: [
      "Drop your right ear toward your right shoulder.",
      "Place your right hand gently on top of your head for feather-light traction.",
      "Extend your left fingertips downward toward the floor.",
      "Switch to the left side when the timer indicates halfway.",
    ],
    cue: "Keep the opposite shoulder anchored down.",
    iconBg: "from-teal-500 to-emerald-600",
  },
  {
    id: 6,
    name: "Wrist, Forearm & Keyboard Release",
    duration: 45,
    targetMuscles: ["Forearm Flexors", "Carpal Tunnel Tendons"],
    instructions: [
      "Extend your right arm straight forward with palm facing away.",
      "Use your left hand to gently pull your fingers backward toward you.",
      "Hold 15s, then flip the wrist so fingers point downward.",
      "Repeat the sequence on the left hand.",
    ],
    cue: "Essential reset for typing and writing fatigue.",
    iconBg: "from-rose-500 to-pink-600",
  },
  {
    id: 7,
    name: "Eagle Arms / Upper Back Scapular Spread",
    duration: 50,
    targetMuscles: ["Rhomboids", "Infraspinatus", "Middle Back"],
    instructions: [
      "Cross your right arm under your left at the elbows.",
      "Wrap forearms around each other until palms (or backs of hands) touch.",
      "Lift your elbows to shoulder height and press your hands slightly away.",
      "Breathe deeply into the space between your shoulder blades, then swap arms.",
    ],
    cue: "Feel the tight knots between your shoulder blades softening.",
    iconBg: "from-purple-500 to-indigo-600",
  },
  {
    id: 8,
    name: "Full Posture Reset & Deep Diaphragmatic Breath",
    duration: 60,
    targetMuscles: ["Diaphragm", "Core Stabilizers", "Postural Aligners"],
    instructions: [
      "Sit back evenly on your sit bones, feet firmly grounded.",
      "Imagine a cord pulling the crown of your head gently toward the ceiling.",
      "Inhale slowly through the nose for 4 counts, expanding the belly and ribs.",
      "Exhale slowly through the mouth for 6 counts, releasing all remaining tension.",
    ],
    cue: "Lock in this upright, open, and relaxed posture.",
    iconBg: "from-cyan-500 to-blue-600",
  },
];

const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Exhausted", "Tense", "Neutral", "Refreshed", "Energized"];

export function StretchClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(POSES[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const [moodBefore, setMoodBefore] = useState(2);
  const [moodAfter, setMoodAfter] = useState(4);
  const [saving, setSaving] = useState(false);

  const currentPose = POSES[currentIndex];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timer when changing pose manually
  useEffect(() => {
    setTimeLeft(currentPose.duration);
  }, [currentIndex, currentPose.duration]);

  // Main countdown loop
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Step finished!
        if (soundEnabled && relaxAudio) {
          relaxAudio.playChime(587.33, 2.5); // D5 chime
        }

        if (currentIndex < POSES.length - 1) {
          setCurrentIndex((idx) => idx + 1);
          return POSES[currentIndex + 1].duration;
        } else {
          setIsRunning(false);
          setIsCompleted(true);
          return 0;
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentIndex, soundEnabled]);

  const progressPercent = Math.round(
    ((currentPose.duration - timeLeft) / currentPose.duration) * 100
  );

  const totalCompletedSecs =
    POSES.slice(0, currentIndex).reduce((acc, p) => acc + p.duration, 0) +
    (currentPose.duration - timeLeft);
  const totalSessionSecs = POSES.reduce((acc, p) => acc + p.duration, 0);
  const overallPercent = Math.round((totalCompletedSecs / totalSessionSecs) * 100);

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  function handleNext() {
    if (currentIndex < POSES.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsRunning(false);
      setIsCompleted(true);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setTimeLeft(POSES[0].duration);
    setIsRunning(false);
    setIsCompleted(false);
  }

  async function handleSaveSession() {
    setSaving(true);
    try {
      await api("/api/relax", {
        method: "POST",
        body: JSON.stringify({
          activityType: "stretch",
          title: "Neck & Shoulder Study Stretch",
          durationMin: Math.max(1, Math.round(totalSessionSecs / 60)),
          moodBefore,
          moodAfter,
        }),
      });
      toast({
        title: "Stretch session saved! 🤸",
        description: `Logged 8 minutes of tension relief (+${moodAfter - moodBefore} mood boost).`,
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
        title="Neck & Shoulder Study Stretch"
        subtitle="8-minute guided desk relief. Release upper back hunch and recharge your focus."
        action={
          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            title={soundEnabled ? "Mute chimes" : "Enable chimes"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="size-4 text-emerald-600" /> Chimes ON
              </>
            ) : (
              <>
                <VolumeX className="size-4 text-slate-400" /> Chimes Muted
              </>
            )}
          </button>
        }
      />

      {/* Completion Modal / Card */}
      {isCompleted ? (
        <Card className="p-8 text-center sm:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
            Stretch Routine Completed!
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            You just released neck & shoulder tension and restored healthy blood circulation to your brain.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-100 bg-slate-50/70 p-6 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              How do you feel now?
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
                <Sparkles className="size-4" /> Save to My History
              </Button>
              <Button
                variant="secondary"
                onClick={handleRestart}
              >
                <RotateCcw className="size-4" /> Repeat Routine
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main active stretch card */}
          <Card className="overflow-hidden p-6 sm:p-8">
            {/* Header with step pill & overall progress */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md",
                    currentPose.iconBg
                  )}
                >
                  <PersonStanding className="size-7" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Step {currentPose.id} of {POSES.length}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900">{currentPose.name}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentPose.targetMuscles.map((m) => (
                  <Badge key={m} color="slate">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Step content grid */}
            <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Instructions column */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100/80">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                    Mindful Cue
                  </p>
                  <p className="mt-1 text-sm font-semibold text-indigo-950">{currentPose.cue}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    How to perform
                  </h4>
                  <ul className="space-y-2">
                    {currentPose.instructions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Timer circle column */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="relative flex size-44 items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-slate-100"
                      strokeWidth="7"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      className="stroke-indigo-600 transition-all duration-300 ease-linear"
                      strokeWidth="7"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * progressPercent) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {timeLeft}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      seconds
                    </span>
                  </div>
                </div>

                {/* Control buttons */}
                <div className="mt-5 flex items-center gap-3">
                  <Button
                    size="lg"
                    variant={isRunning ? "secondary" : "primary"}
                    className="min-w-[130px]"
                    onClick={() => {
                      if (!isRunning && soundEnabled && relaxAudio) {
                        relaxAudio.playChime(440, 1);
                      }
                      setIsRunning((r) => !r);
                    }}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="size-4.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-4.5" /> Start Pose
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Stepper Navigation Footer */}
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="size-4" /> Previous Pose
              </Button>

              <div className="flex gap-1.5">
                {POSES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i);
                      setIsRunning(false);
                    }}
                    className={cn(
                      "size-2.5 rounded-full transition-all cursor-pointer",
                      i === currentIndex
                        ? "w-7 bg-indigo-600"
                        : i < currentIndex
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    )}
                    aria-label={`Jump to stretch ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleNext}
              >
                {currentIndex === POSES.length - 1 ? (
                  <>
                    Finish <CheckCircle2 className="size-4 text-emerald-600" />
                  </>
                ) : (
                  <>
                    Next Pose <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Routine overview table / card */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Entire 8-Step Routine Sequence</h3>
              <Badge color="emerald">{overallPercent}% completed</Badge>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {POSES.map((p, idx) => {
                const isDone = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsRunning(false);
                    }}
                    className={cn(
                      "flex items-start gap-2.5 rounded-xl border p-3 text-left transition cursor-pointer",
                      isCurrent
                        ? "border-indigo-400 bg-indigo-50/50 shadow-sm"
                        : isDone
                        ? "border-emerald-200 bg-emerald-50/30 text-slate-700"
                        : "border-slate-100 hover:border-slate-200 bg-slate-50/40 text-slate-500"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                        isCurrent
                          ? "bg-indigo-600 text-white"
                          : isDone
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {isDone ? "✓" : p.id}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.duration}s</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
