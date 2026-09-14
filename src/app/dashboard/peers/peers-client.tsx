"use client";

import { useEffect, useState } from "react";
import {
  Check,
  HandHeart,
  MessageCircle,
  Search,
  ShieldCheck,
  Swords,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  SectionTitle,
  Skeleton,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { api } from "@/lib/api";
import { cn, timeAgo } from "@/lib/utils";
import type { User } from "@/db/schema";

type PeerRow = {
  id: string;
  status: "pending" | "accepted" | "declined";
  direction: "incoming" | "outgoing";
  createdAt: string;
  user: { id: string; name: string; email: string; classGrade: string; examTarget: string };
};

type SearchRow = {
  id: string;
  name: string;
  email: string;
  classGrade: string;
  examTarget: string;
};

const PRESSURE_TIPS = [
  {
    icon: Swords,
    color: "bg-rose-50 text-rose-600",
    title: "The 'finished chapters' trap",
    body: "When a friend brags about finishing 3 chapters, they rarely mention they skipped 20 questions. Ask WHAT they solved, not what they read.",
  },
  {
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    title: "Set your own pace contract",
    body: "Write your weekly plan on Sunday. When pressure hits, compare yourself to the plan — not to anyone else's speed.",
  },
  {
    icon: HandHeart,
    color: "bg-indigo-50 text-indigo-600",
    title: "Convert pressure into pods",
    body: "Feeling left behind? Invite that 'ahead' friend to a shared study pod. Turns jealousy into a learning session.",
  },
  {
    icon: MessageCircle,
    color: "bg-amber-50 text-amber-600",
    title: "The honest reply script",
    body: "“I'm on my own track — happy to share notes though!” One sentence that ends comparison conversations kindly.",
  },
];

export function PeersClient({ me }: { me: User }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<PeerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  async function loadPeers() {
    try {
      const data = await api<PeerRow[]>("/api/peers");
      setRows(data);
    } catch {
      toast({ title: "Could not load peers", kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<SearchRow[]>(`/api/users/search?q=${encodeURIComponent(q)}`);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.direction === "incoming");
  const outgoing = rows.filter((r) => r.status === "pending" && r.direction === "outgoing");
  const relationByUserId = new Map(rows.map((r) => [r.user.id, r]));

  async function sendRequest(target: SearchRow) {
    setRequestingId(target.id);
    try {
      await api("/api/peers", {
        method: "POST",
        body: JSON.stringify({ addresseeId: target.id }),
      });
      toast({
        title: "Request sent 🤝",
        description: `${target.name} will see your study-buddy request.`,
      });
      await loadPeers();
      setQuery("");
      setResults([]);
    } catch (e) {
      toast({
        title: "Could not send request",
        description: e instanceof Error ? e.message : undefined,
        kind: "error",
      });
    } finally {
      setRequestingId(null);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setActingId(id);
    try {
      await api(`/api/peers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toast({
        title: action === "accept" ? "Peer added 🎉" : "Request declined",
        description: action === "accept" ? "You can now pod together." : undefined,
      });
      await loadPeers();
    } catch {
      toast({ title: "Something went wrong", kind: "error" });
    } finally {
      setActingId(null);
    }
  }

  async function remove(id: string, name: string) {
    // optimistic
    setRows((prev) => prev.filter((r) => r.id !== id));
    try {
      await api(`/api/peers/${id}`, { method: "DELETE" });
      toast({ title: `Removed ${name}`, kind: "info" });
    } catch {
      await loadPeers();
      toast({ title: "Could not remove peer", kind: "error" });
    }
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SectionTitle
        title="Peers"
        subtitle="Study buddies at your pace — collaboration without comparison."
      />

      {/* Search */}
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Search className="size-4 text-indigo-500" /> Find study buddies
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Search by name, email, or try <span className="font-bold">"Class 11"</span> to find classmates.
        </p>
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-10"
            placeholder="e.g. Riya, riya@focusnest.app, Class 11…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {query.trim() && (
          <div className="mt-4">
            {searching ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : results.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No students found for “{query}”. Try their email or class.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                {results.map((r) => {
                  const rel = relationByUserId.get(r.id);
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <Avatar name={r.name} seed={r.id} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{r.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {r.classGrade} · {r.examTarget} · {r.email}
                        </p>
                      </div>
                      {rel ? (
                        <Badge
                          color={
                            rel.status === "accepted"
                              ? "emerald"
                              : rel.direction === "outgoing"
                                ? "amber"
                                : "sky"
                          }
                        >
                          {rel.status === "accepted"
                            ? "Already peers"
                            : rel.direction === "outgoing"
                              ? "Request sent"
                              : "Wants to connect →"}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          loading={requestingId === r.id}
                          onClick={() => sendRequest(r)}
                        >
                          <UserPlus className="size-3.5" /> Add
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Requests */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Requests</h2>
            <Badge color={incoming.length ? "indigo" : "slate"}>{incoming.length} incoming</Badge>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : incoming.length === 0 && outgoing.length === 0 ? (
            <EmptyState
              className="m-5 border-0 bg-transparent py-8"
              icon={<Users className="size-6" />}
              title="No open requests"
              description="Search above to send a buddy request, or wait for one to arrive."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {incoming.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                  <Avatar name={r.user.name} seed={r.user.id} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{r.user.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {r.user.classGrade} · {r.user.examTarget} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="success"
                    loading={actingId === r.id}
                    onClick={() => respond(r.id, "accept")}
                  >
                    <Check className="size-3.5" /> Accept
                  </Button>
                  <button
                    onClick={() => respond(r.id, "decline")}
                    className="rounded-lg p-2 text-slate-300 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                    aria-label="Decline"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
              {outgoing.map((r) => (
                <li key={r.id} className="flex items-center gap-3 bg-slate-50/50 px-5 py-4">
                  <Avatar name={r.user.name} seed={r.user.id} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-700">{r.user.name}</p>
                    <p className="truncate text-xs text-slate-400">Waiting for reply…</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id, r.user.name)}>
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* My peers */}
        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">My study nest</h2>
            <Badge color="emerald">{accepted.length} peers</Badge>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : accepted.length === 0 ? (
            <EmptyState
              className="m-5 border-0 bg-transparent py-8"
              icon={<Users className="size-6" />}
              title="No peers yet"
              description="Your study nest is empty. Find someone at your class level to pod with."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {accepted.map((r) => (
                <li key={r.id} className="group flex items-center gap-3 px-5 py-4">
                  <Avatar name={r.user.name} seed={r.user.id} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{r.user.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {r.user.classGrade} · {r.user.examTarget}
                    </p>
                  </div>
                  <Badge color="emerald" className="hidden sm:inline-flex">
                    study buddy
                  </Badge>
                  <button
                    onClick={() => remove(r.id, r.user.name)}
                    className="rounded-lg p-2 text-slate-300 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 cursor-pointer"
                    aria-label="Remove peer"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-[11px] leading-relaxed text-slate-400">
              💡 Pro move: start a study pod with a peer and message each other on Doubt Desk —
              explaining a concept to a buddy is the fastest way to master it.
            </p>
          </div>
        </Card>
      </div>

      {/* Peer pressure playbook */}
      <div className="mt-6">
        <h2 className="mb-1 text-sm font-extrabold text-slate-900">
          Peer-pressure playbook
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          Comparison is normal. Getting derailed by it isn't. Your counter-moves:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRESSURE_TIPS.map((t) => (
            <Card key={t.title} className="p-5">
              <div className="flex items-start gap-3.5">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", t.color)}>
                  <t.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{t.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
