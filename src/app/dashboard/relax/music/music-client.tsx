"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CloudRain,
  Headphones,
  Leaf,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { relaxAudio } from "@/lib/relax-audio";
import { cn } from "@/lib/utils";

interface Track {
  id: "rain" | "ocean" | "forest" | "brownNoise" | "alphaWaves";
  name: string;
  icon: typeof CloudRain;
  color: string;
  description: string;
  frequencyHint: string;
}

const TRACKS: Track[] = [
  {
    id: "rain",
    name: "Rainfall & Droplets",
    icon: CloudRain,
    color: "from-sky-500 to-blue-600",
    description: "Soothing filtered pink noise simulating steady drops on foliage.",
    frequencyHint: "Pink noise spectrum",
  },
  {
    id: "ocean",
    name: "Deep Ocean Waves",
    icon: Waves,
    color: "from-teal-500 to-cyan-600",
    description: "Slow rhythmic tidal surges. Matches deep parasympathetic breathing.",
    frequencyHint: "Low-pass 0.12 Hz cycle",
  },
  {
    id: "forest",
    name: "Forest Canopy Breeze",
    icon: Leaf,
    color: "from-emerald-500 to-green-600",
    description: "Gentle whispering pine breeze with natural organic fluctuations.",
    frequencyHint: "Mid-band acoustic rustle",
  },
  {
    id: "brownNoise",
    name: "Heavy Brown Noise",
    icon: Zap,
    color: "from-amber-600 to-amber-800",
    description: "Deep low-frequency roar. Ideal for ADHD, tinnitus, and study silence.",
    frequencyHint: "1/f² power falloff",
  },
  {
    id: "alphaWaves",
    name: "10 Hz Alpha Binaural Beat",
    icon: Headphones,
    color: "from-violet-500 to-purple-700",
    description: "Synchronizes cerebral hemispheres for calm, clear retention. (Headphones recommended)",
    frequencyHint: "196 Hz / 206 Hz offset",
  },
];

const PRESETS = [
  {
    name: "Stormy Study Corner",
    emoji: "🌧️",
    volumes: { rain: 0.75, ocean: 0.0, forest: 0.15, brownNoise: 0.35, alphaWaves: 0.2 },
  },
  {
    name: "Alpha Retention Flow",
    emoji: "🧠",
    volumes: { rain: 0.15, ocean: 0.0, forest: 0.0, brownNoise: 0.45, alphaWaves: 0.75 },
  },
  {
    name: "Coastal Haven",
    emoji: "🌊",
    volumes: { rain: 0.0, ocean: 0.7, forest: 0.3, brownNoise: 0.1, alphaWaves: 0.25 },
  },
  {
    name: "Deep Brown Denoise",
    emoji: "⚡",
    volumes: { rain: 0.1, ocean: 0.1, forest: 0.0, brownNoise: 0.85, alphaWaves: 0.1 },
  },
];

const TIMER_OPTIONS = [5, 15, 25, 45, 60];
const MOODS = [1, 2, 3, 4, 5];
const MOOD_LABELS = ["Scattered", "Stressed", "Neutral", "Centered", "Deeply Peaceful"];

export function MusicClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.75);
  const [trackVolumes, setTrackVolumes] = useState<{
    rain: number;
    ocean: number;
    forest: number;
    brownNoise: number;
    alphaWaves: number;
  }>({
    rain: 0.6,
    ocean: 0.0,
    forest: 0.2,
    brownNoise: 0.3,
    alphaWaves: 0.3,
  });

  const [timerMin, setTimerMin] = useState<number | null>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [sessionMinutesElapsed, setSessionMinutesElapsed] = useState(0);

  const [moodBefore, setMoodBefore] = useState(2);
  const [moodAfter, setMoodAfter] = useState(5);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync audio volumes to Web Audio engine
  useEffect(() => {
    if (!relaxAudio) return;
    if (isPlaying) {
      relaxAudio.setMasterVolume(masterVolume);
      (Object.keys(trackVolumes) as Array<keyof typeof trackVolumes>).forEach((ch) => {
        relaxAudio.setTrackVolume(ch, trackVolumes[ch]);
      });
    } else {
      relaxAudio.stopAllSoundscapes();
    }
  }, [isPlaying, masterVolume, trackVolumes]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (relaxAudio) relaxAudio.stopAllSoundscapes();
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isPlaying || timerMin === null) return;

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) {
          if ((s % 60) === 0) {
            setSessionMinutesElapsed((m) => m + 1);
          }
          return s - 1;
        }
        // Timer completed!
        setIsPlaying(false);
        if (relaxAudio) {
          relaxAudio.stopAllSoundscapes();
          relaxAudio.playChime(528, 3);
        }
        toast({
          title: "Soundscape break completed 🎧",
          description: "Your listening timer has ended peacefully.",
          kind: "info",
        });
        setLogModalOpen(true);
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, timerMin, toast]);

  function handleSetTimer(mins: number) {
    setTimerMin(mins);
    setSecondsLeft(mins * 60);
  }

  function handleApplyPreset(preset: typeof PRESETS[0]) {
    setTrackVolumes(preset.volumes);
    if (!isPlaying) {
      setIsPlaying(true);
    }
    toast({
      title: `${preset.emoji} Applied "${preset.name}" preset`,
      kind: "info",
    });
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function handleSaveSession() {
    setSaving(true);
    const loggedMins = Math.max(1, sessionMinutesElapsed || timerMin || 15);
    try {
      await api("/api/relax", {
        method: "POST",
        body: JSON.stringify({
          activityType: "music",
          title: `Lo-fi Soundscape Session (${loggedMins} min)`,
          durationMin: loggedMins,
          moodBefore,
          moodAfter,
        }),
      });
      toast({
        title: "Soundscape break saved! 🎧",
        description: `Logged ${loggedMins} minutes of neural audio calm.`,
        kind: "success",
      });
      setLogModalOpen(false);
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
        title="Lo-fi & Ambient Soundscape Studio"
        subtitle="Custom neural audio environments. Mask distracting dorm noise and trigger alpha-band study focus."
        action={
          <Button
            variant="secondary"
            onClick={() => setLogModalOpen(true)}
          >
            <Sparkles className="size-4 text-violet-600" /> Log Session
          </Button>
        }
      />

      {/* Hero Soundscape Player & Visualizer */}
      <Card className="overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={cn(
                "flex size-16 items-center justify-center rounded-2xl transition-all shadow-lg cursor-pointer active:scale-95",
                isPlaying
                  ? "bg-violet-500 text-white shadow-violet-500/40"
                  : "bg-white text-slate-900 hover:bg-slate-100"
              )}
              aria-label={isPlaying ? "Pause Soundscape" : "Play Soundscape"}
            >
              {isPlaying ? <Pause className="size-8" /> : <Play className="size-8 translate-x-0.5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  {isPlaying ? "Ambient Generator Active" : "Soundscape Paused"}
                </h2>
                {isPlaying && (
                  <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <p className="text-xs text-violet-200/70 mt-0.5">
                Multi-channel Web Audio synthesis · 100% offline & ad-free
              </p>
            </div>
          </div>

          {/* Sleep / Session Timer */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md">
            <Timer className="size-4 text-violet-300" />
            <div className="text-right">
              <p className="text-base font-extrabold tracking-tight text-white">
                {timerMin !== null ? formatTime(secondsLeft) : "Continuous"}
              </p>
              <p className="text-[10px] uppercase font-bold text-violet-300">Session Timer</p>
            </div>
          </div>
        </div>

        {/* Audio Visualizer Wave Graphic */}
        <div className="mt-8 flex items-end justify-center gap-1.5 h-14 overflow-hidden px-4">
          {Array.from({ length: 32 }).map((_, i) => {
            const isCenter = Math.abs(i - 16);
            const scale = Math.max(0.2, (16 - isCenter) / 16);
            return (
              <div
                key={i}
                className={cn(
                  "w-1.5 rounded-full bg-gradient-to-t from-violet-500 to-indigo-300 transition-all duration-300",
                  isPlaying ? "animate-pulse" : "opacity-30 h-2"
                )}
                style={{
                  height: isPlaying ? `${Math.floor(scale * 48 + Math.random() * 8)}px` : "6px",
                  animationDelay: `${i * 45}ms`,
                  animationDuration: "800ms",
                }}
              />
            );
          })}
        </div>

        {/* Master Volume Slider */}
        <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
          <Volume2 className="size-4 text-violet-300 shrink-0" />
          <span className="text-xs font-semibold text-violet-200">Master Level</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="flex-1 accent-violet-400 cursor-pointer"
          />
          <span className="text-xs font-bold text-violet-300 w-10 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>
      </Card>

      {/* Preset Buttons */}
      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Instant Sound Atmospheres
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-violet-300 hover:shadow-sm cursor-pointer"
            >
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <p className="text-xs font-extrabold text-slate-900">{p.name}</p>
                <p className="text-[10px] font-semibold text-violet-600">Apply Preset</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Multi-track Channel Mixer */}
      <Card className="mt-6 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="size-4 text-violet-600" /> Channel Mixer
            </h3>
            <p className="text-xs text-slate-500">Fine-tune each individual audio element in real time.</p>
          </div>
          <Badge color="violet">5 Channels Active</Badge>
        </div>

        <div className="space-y-6">
          {TRACKS.map((t) => {
            const vol = trackVolumes[t.id];
            const Icon = t.icon;
            return (
              <div key={t.id} className="grid gap-3 sm:grid-cols-12 sm:items-center">
                <div className="sm:col-span-5 flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                      t.color
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">{t.name}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {t.frequencyHint}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-7 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={vol}
                    onChange={(e) => {
                      const newVol = parseFloat(e.target.value);
                      setTrackVolumes((prev) => ({ ...prev, [t.id]: newVol }));
                      if (!isPlaying) setIsPlaying(true);
                    }}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="w-10 text-right text-xs font-extrabold text-slate-700">
                    {Math.round(vol * 100)}%
                  </span>
                  <button
                    onClick={() => {
                      setTrackVolumes((prev) => ({ ...prev, [t.id]: vol > 0 ? 0 : 0.5 }));
                    }}
                    className={cn(
                      "rounded-lg p-1.5 text-xs font-bold transition cursor-pointer",
                      vol > 0
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-rose-50 text-rose-500"
                    )}
                    title={vol > 0 ? "Mute channel" : "Unmute channel"}
                  >
                    {vol > 0 ? "Mute" : "Off"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timer Selection Strip */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-500">Timer duration:</span>
            <div className="flex flex-wrap gap-2">
              {TIMER_OPTIONS.map((min) => (
                <button
                  key={min}
                  onClick={() => handleSetTimer(min)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                    timerMin === min
                      ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  {min} min
                </button>
              ))}
              <button
                onClick={() => setTimerMin(null)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                  timerMin === null
                    ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                )}
              >
                Infinite
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Log Modal */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s]">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Headphones className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Log Audio Break
                </h3>
                <p className="text-xs text-slate-500">Record your soundscape listening session.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Approximate Minutes
                </label>
                <div className="flex gap-2">
                  {[10, 15, 25, 45, 60].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSessionMinutesElapsed(m)}
                      className={cn(
                        "flex-1 rounded-xl border py-2 text-xs font-bold transition cursor-pointer",
                        (sessionMinutesElapsed || timerMin || 15) === m
                          ? "border-violet-400 bg-violet-50 text-violet-700"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                            ? "border-violet-400 bg-violet-50 text-violet-700"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">{MOOD_LABELS[moodBefore - 1]}</p>
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
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">{MOOD_LABELS[moodAfter - 1]}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setLogModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="success" loading={saving} onClick={handleSaveSession}>
                  <Sparkles className="size-4" /> Save to History
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
