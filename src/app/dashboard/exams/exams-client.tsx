"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Lightbulb,
  Target,
} from "lucide-react";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ExamInfo } from "@/db/schema";

type BadgeColor = "indigo" | "violet" | "rose" | "amber" | "emerald" | "sky" | "slate";
const EXAM_THEMES: Record<string, { chip: string; badge: BadgeColor; border: string }> = {
  "JEE Main": {
    chip: "data-[on=true]:bg-indigo-600 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "indigo",
    border: "border-t-indigo-400",
  },
  "JEE Advanced": {
    chip: "data-[on=true]:bg-violet-600 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "violet",
    border: "border-t-violet-400",
  },
  NEET: {
    chip: "data-[on=true]:bg-rose-600 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "rose",
    border: "border-t-rose-400",
  },
  BITSAT: {
    chip: "data-[on=true]:bg-amber-600 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "amber",
    border: "border-t-amber-400",
  },
  CUET: {
    chip: "data-[on=true]:bg-emerald-600 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "emerald",
    border: "border-t-emerald-400",
  },
  Olympiad: {
    chip: "data-[on=true]:bg-sky-600 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "sky",
    border: "border-t-sky-400",
  },
  NTSE: {
    chip: "data-[on=true]:bg-slate-700 data-[on=true]:text-white bg-slate-100 text-slate-600 hover:bg-slate-200",
    badge: "slate",
    border: "border-t-slate-400",
  },
};

export function ExamsClient({ cards, defaultExam }: { cards: ExamInfo[]; defaultExam: string }) {
  const examNames = useMemo(() => Array.from(new Set(cards.map((c) => c.examName))), [cards]);
  const [exam, setExam] = useState<string>(
    examNames.includes(defaultExam) ? defaultExam : examNames[0]
  );
  const [classLevel, setClassLevel] = useState("All");

  const filtered = cards.filter(
    (c) => c.examName === exam && (classLevel === "All" || c.classLevel === classLevel)
  );
  const theme = EXAM_THEMES[exam] ?? EXAM_THEMES["JEE Main"];

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SectionTitle
        title="Exam Intel"
        subtitle="Chapter-wise weightage, question patterns and prep roadmaps — curated for JEE, NEET and beyond."
      />

      {/* Exam chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {examNames.map((e) => (
          <button
            key={e}
            data-on={exam === e}
            onClick={() => {
              setExam(e);
              setClassLevel("All");
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition cursor-pointer",
              EXAM_THEMES[e]?.chip ?? "bg-slate-100 text-slate-600 hover:bg-slate-200 data-[on=true]:bg-slate-700 data-[on=true]:text-white"
            )}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Class filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
          <GraduationCap className="size-3.5" /> Class:
        </span>
        {["All", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((c) => (
          <button
            key={c}
            onClick={() => setClassLevel(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-bold transition cursor-pointer",
              classLevel === c
                ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpenCheck className="size-6" />}
          title="No intel for this combo yet"
          description="Try another class level — new cards drop every week."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className={cn("overflow-hidden border-t-4", theme.border)}>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={theme.badge}>{c.subject}</Badge>
                  <Badge color="slate">{c.classLevel}</Badge>
                  <span className="ml-auto flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Target className="size-3.5" /> {c.examName}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold leading-snug text-slate-900">
                  {c.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{c.body}</p>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    <Lightbulb className="size-3.5 text-amber-500" /> Key points
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {c.keyPoints.map((k) => (
                      <li key={k} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>

                {c.link && (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    Official exam site <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-4 text-xs leading-relaxed text-slate-400">
        ⚠️ Weightage and patterns are community-sourced estimates from recent papers — always
        verify the latest syllabus on the official exam website before final prep.
      </p>
    </div>
  );
}
