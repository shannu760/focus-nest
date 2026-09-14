"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  HelpCircle,
  MessageCircleQuestion,
  Plus,
  Search,
  Send,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import {
  Avatar,
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
import { SUBJECTS, cn, timeAgo } from "@/lib/utils";
import type { User } from "@/db/schema";

type DoubtRow = {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  subject: string;
  classGrade: string;
  resolved: boolean;
  createdAt: string;
  answerCount: number;
  upvoteCount: number;
  myUpvote: boolean;
};

type AnswerRow = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  accepted: boolean;
  createdAt: string;
  upvoteCount: number;
  myUpvote: boolean;
};

export function DoubtsClient({ me }: { me: User }) {
  const { toast } = useToast();
  const [doubts, setDoubts] = useState<DoubtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRow[]>>({});
  const [answersLoading, setAnswersLoading] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadDoubts() {
    try {
      const data = await api<DoubtRow[]>("/api/doubts");
      setDoubts(data);
    } catch {
      toast({ title: "Could not load doubts", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoubts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!answers[id]) {
      setAnswersLoading(true);
      try {
        const data = await api<AnswerRow[]>(`/api/doubts/${id}/answers`);
        setAnswers((prev) => ({ ...prev, [id]: data }));
      } catch {
        toast({ title: "Could not load answers", kind: "error" });
      } finally {
        setAnswersLoading(false);
      }
    }
  }

  /* ------------------------------ doubt CRUD ------------------------------ */

  async function createDoubt(data: {
    title: string;
    body: string;
    subject: string;
    classGrade: string;
  }) {
    setSaving(true);
    try {
      const row = await api<DoubtRow>("/api/doubts", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setDoubts((prev) => [row, ...prev]);
      setAskOpen(false);
      toast({ title: "Doubt posted 🙋", description: "The community will answer soon." });
    } catch (e) {
      toast({
        title: "Could not post",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function upvoteDoubt(id: string) {
    const d = doubts.find((x) => x.id === id);
    if (!d) return;
    // optimistic
    setDoubts((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              myUpvote: !x.myUpvote,
              upvoteCount: x.upvoteCount + (x.myUpvote ? -1 : 1),
            }
          : x
      )
    );
    try {
      await api(`/api/doubts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "upvote" }),
      });
    } catch {
      setDoubts((prev) => prev.map((x) => (x.id === id ? d : x)));
      toast({ title: "Upvote failed", kind: "error" });
    }
  }

  async function resolveDoubt(id: string) {
    const d = doubts.find((x) => x.id === id);
    if (!d) return;
    setDoubts((prev) => prev.map((x) => (x.id === id ? { ...x, resolved: !x.resolved } : x)));
    try {
      await api(`/api/doubts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "resolve" }),
      });
    } catch {
      setDoubts((prev) => prev.map((x) => (x.id === id ? d : x)));
      toast({ title: "Could not update", kind: "error" });
    }
  }

  async function deleteDoubt(id: string) {
    const previous = doubts;
    setDoubts((prev) => prev.filter((x) => x.id !== id));
    setExpandedId(null);
    try {
      await api(`/api/doubts/${id}`, { method: "DELETE" });
      toast({ title: "Doubt removed", kind: "info" });
    } catch {
      setDoubts(previous);
      toast({ title: "Could not delete", kind: "error" });
    }
  }

  /* ------------------------------ answer CRUD ----------------------------- */

  async function postAnswer(doubtId: string, body: string) {
    if (body.trim().length < 5) return;
    const temp: AnswerRow = {
      id: `temp-${Date.now()}`,
      authorId: me.id,
      authorName: me.name,
      body: body.trim(),
      accepted: false,
      createdAt: new Date().toISOString(),
      upvoteCount: 0,
      myUpvote: false,
    };
    setAnswers((prev) => ({ ...prev, [doubtId]: [...(prev[doubtId] ?? []), temp] }));
    setDoubts((prev) =>
      prev.map((x) => (x.id === doubtId ? { ...x, answerCount: x.answerCount + 1 } : x))
    );
    try {
      const row = await api<AnswerRow>(`/api/doubts/${doubtId}/answers`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setAnswers((prev) => ({
        ...prev,
        [doubtId]: (prev[doubtId] ?? []).map((a) => (a.id === temp.id ? row : a)),
      }));
      toast({ title: "Answer posted ✍️" });
    } catch (e) {
      setAnswers((prev) => ({
        ...prev,
        [doubtId]: (prev[doubtId] ?? []).filter((a) => a.id !== temp.id),
      }));
      toast({
        title: "Could not post answer",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
    }
  }

  async function upvoteAnswer(doubtId: string, answerId: string) {
    const list = answers[doubtId] ?? [];
    const a = list.find((x) => x.id === answerId);
    if (!a) return;
    setAnswers((prev) => ({
      ...prev,
      [doubtId]: (prev[doubtId] ?? []).map((x) =>
        x.id === answerId
          ? { ...x, myUpvote: !x.myUpvote, upvoteCount: x.upvoteCount + (x.myUpvote ? -1 : 1) }
          : x
      ),
    }));
    try {
      await api(`/api/answers/${answerId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "upvote" }),
      });
    } catch {
      setAnswers((prev) => ({
        ...prev,
        [doubtId]: (prev[doubtId] ?? []).map((x) => (x.id === answerId ? a : x)),
      }));
    }
  }

  async function acceptAnswer(doubtId: string, answerId: string) {
    const list = answers[doubtId] ?? [];
    const previous = list;
    setAnswers((prev) => ({
      ...prev,
      [doubtId]: (prev[doubtId] ?? []).map((x) => ({
        ...x,
        accepted: x.id === answerId,
      })),
    }));
    try {
      await api(`/api/answers/${answerId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      });
      setDoubts((prev) =>
        prev.map((x) => (x.id === doubtId ? { ...x, resolved: true } : x))
      );
      toast({ title: "Best answer accepted ✅", description: "Doubt marked as resolved." });
    } catch (e) {
      setAnswers((prev) => ({ ...prev, [doubtId]: previous }));
      toast({
        title: "Could not accept",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
    }
  }

  async function deleteAnswer(doubtId: string, answerId: string) {
    const list = answers[doubtId] ?? [];
    setAnswers((prev) => ({
      ...prev,
      [doubtId]: (prev[doubtId] ?? []).filter((x) => x.id !== answerId),
    }));
    setDoubts((prev) =>
      prev.map((x) => (x.id === doubtId ? { ...x, answerCount: Math.max(0, x.answerCount - 1) } : x))
    );
    try {
      await api(`/api/answers/${answerId}`, { method: "DELETE" });
    } catch {
      setAnswers((prev) => ({ ...prev, [doubtId]: list }));
      toast({ title: "Could not delete answer", kind: "error" });
    }
  }

  const filtered = doubts.filter((d) => {
    if (subjectFilter !== "All" && d.subject !== subjectFilter) return false;
    if (unresolvedOnly && d.resolved) return false;
    if (query && !`${d.title} ${d.body}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SectionTitle
        title="Doubt Desk"
        subtitle="Stuck? Ask. Know? Answer. The nest learns together."
        action={
          <Button onClick={() => setAskOpen(true)}>
            <Plus className="size-4" /> Ask a doubt
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="Search doubts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["All", ...SUBJECTS.slice(0, 6)].map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                subjectFilter === s
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setUnresolvedOnly((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition cursor-pointer",
            unresolvedOnly
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          Unsolved only
          {unresolvedOnly && <Check className="size-3.5" />}
        </button>
      </Card>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<MessageCircleQuestion className="size-6" />}
          title={doubts.length === 0 ? "No doubts yet" : "Nothing matches"}
          description={
            doubts.length === 0
              ? "Be the first to ask — no doubt is too small."
              : "Try a different subject or clear the filters."
          }
          action={
            doubts.length === 0 ? (
              <Button onClick={() => setAskOpen(true)}>
                <Plus className="size-4" /> Ask the first doubt
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => {
            const isOpen = expandedId === d.id;
            const list = answers[d.id] ?? [];
            return (
              <Card key={d.id} className="overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar name={d.authorName} seed={d.authorId} className="size-7 text-[10px]" />
                    <span className="text-xs font-bold text-slate-700">{d.authorName}</span>
                    <span className="text-xs text-slate-400">· {timeAgo(d.createdAt)}</span>
                    <Badge color="violet">{d.subject}</Badge>
                    <Badge color="slate">{d.classGrade}</Badge>
                    {d.resolved && <Badge color="emerald">✓ resolved</Badge>}
                    {d.authorId === me.id && (
                      <Badge color="sky">your doubt</Badge>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-extrabold leading-snug text-slate-900">
                    {d.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {d.body}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => upvoteDoubt(d.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition cursor-pointer",
                        d.myUpvote
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <ThumbsUp className={cn("size-3.5", d.myUpvote && "fill-indigo-600")} />
                      {d.upvoteCount}
                    </button>
                    <button
                      onClick={() => toggleExpand(d.id)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      <MessageCircleQuestion className="size-3.5" />
                      {d.answerCount} {d.answerCount === 1 ? "answer" : "answers"}
                      <ChevronDown
                        className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
                      />
                    </button>
                    <div className="ml-auto flex gap-2">
                      {d.authorId === me.id && (
                        <>
                          <button
                            onClick={() => resolveDoubt(d.id)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          >
                            <BadgeCheck className="size-3.5" />
                            {d.resolved ? "Reopen" : "Mark solved"}
                          </button>
                          <button
                            onClick={() => deleteDoubt(d.id)}
                            className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                            aria-label="Delete doubt"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Answers */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                    {answersLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : list.length === 0 ? (
                      <p className="py-3 text-center text-sm text-slate-400">
                        No answers yet — be the hero and answer below.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {list.map((a) => (
                          <li key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Avatar name={a.authorName} seed={a.authorId} className="size-6 text-[9px]" />
                              <span className="text-xs font-bold text-slate-700">{a.authorName}</span>
                              <span className="text-xs text-slate-400">· {timeAgo(a.createdAt)}</span>
                              {a.accepted && <Badge color="emerald">✓ best answer</Badge>}
                            </div>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                              {a.body}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => upvoteAnswer(d.id, a.id)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition cursor-pointer",
                                  a.myUpvote
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                                )}
                              >
                                <ThumbsUp className={cn("size-3", a.myUpvote && "fill-indigo-600")} />
                                {a.upvoteCount}
                              </button>
                              {d.authorId === me.id && !a.accepted && (
                                <button
                                  onClick={() => acceptAnswer(d.id, a.id)}
                                  className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                                >
                                  <Check className="size-3" /> Accept
                                </button>
                              )}
                              {a.authorId === me.id && (
                                <button
                                  onClick={() => deleteAnswer(d.id, a.id)}
                                  className="rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                                  aria-label="Delete answer"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <AnswerForm onSubmit={(text) => postAnswer(d.id, text)} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Ask modal */}
      <AskModal
        open={askOpen}
        saving={saving}
        me={me}
        onClose={() => setAskOpen(false)}
        onSave={createDoubt}
      />
    </div>
  );
}

function AnswerForm({ onSubmit }: { onSubmit: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  return (
    <div className="mt-4 flex items-start gap-2">
      <Textarea
        rows={2}
        placeholder="Write an answer… explain it like you're teaching a friend."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        className="mt-1"
        loading={posting}
        disabled={text.trim().length < 5}
        onClick={async () => {
          setPosting(true);
          await onSubmit(text);
          setPosting(false);
          setText("");
        }}
      >
        <Send className="size-4" /> Post
      </Button>
    </div>
  );
}

function AskModal({
  open,
  saving,
  me,
  onClose,
  onSave,
}: {
  open: boolean;
  saving: boolean;
  me: User;
  onClose: () => void;
  onSave: (d: { title: string; body: string; subject: string; classGrade: string }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    subject: "Physics",
    classGrade: me.classGrade,
  });

  return (
    <Modal open={open} onClose={onClose} title="Ask a doubt" wide>
      <div className="space-y-4">
        <div>
          <Label htmlFor="doubt-title">Title</Label>
          <Input
            id="doubt-title"
            placeholder="e.g. Why does the normal reaction change on an accelerating lift?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="doubt-subject">Subject</Label>
            <Select
              id="doubt-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            >
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="doubt-class">Class level</Label>
            <Select
              id="doubt-class"
              value={form.classGrade}
              onChange={(e) => setForm({ ...form, classGrade: e.target.value })}
            >
              {["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="doubt-body">Details</Label>
          <Textarea
            id="doubt-body"
            rows={4}
            placeholder="What have you tried? Where exactly are you stuck? The more context, the better the answers."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 px-4 py-3 text-xs leading-relaxed text-sky-700">
          <HelpCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            Good doubts get answered fast: mention the chapter, the step that confused you, and
            what answer you expected vs. got.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={saving}
            disabled={form.title.trim().length < 5 || form.body.trim().length < 10}
            onClick={() =>
              onSave({
                title: form.title.trim(),
                body: form.body.trim(),
                subject: form.subject,
                classGrade: form.classGrade,
              })
            }
          >
            Post doubt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
