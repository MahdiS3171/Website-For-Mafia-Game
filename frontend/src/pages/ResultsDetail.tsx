import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trophy, Users, Skull, Sun, Moon, ArrowRight, Shield, Crown, BadgeCheck, List, Swords } from "lucide-react";
import { api } from "@/lib/api";
import type { GameResults } from "@/types";
import { ArrowLeft } from "lucide-react";

// ---------------- Types that mirror /api/games/:id/results/ ----------------

type ResultPlayerPerformance = {
  // Citizens
  correct_targets_rate?: number; // 0..1
  successful_contribution_rate?: number; // 0..1
  correct_covers_rate?: number; // 0..1
  successful_acts_count?: number;
  // Mafia
  pushes_count?: number;
  city_trust_rate?: number; // 0..1
  successful_claim?: boolean;
};

type ResultPlayer = {
  player_id: number;
  name: string;
  seat_number: number | null;
  role_name: string | null;
  overall_win_rate: number; // 0..1
  terminated_round: number | null;
  terminated_phase: "day" | "night" | null;
  performance: ResultPlayerPerformance;
};

type TimelineEvent = {
  phase_type: "day" | "night";
  round_number: number;
  kind: "finalists" | "termination" | "claim";
  payload: any;
};

// ---------------- Utility ----------------

const pct = (v?: number | null, digits = 0) =>
  typeof v === "number" ? `${(v * 100).toFixed(digits)}%` : "—";

const causeBadgeColor: Record<string, string> = {
  voting: "bg-blue-100 text-blue-700",
  godfather: "bg-red-100 text-red-700",
  killer: "bg-rose-100 text-rose-700",
  sniper: "bg-teal-100 text-teal-700",
  kicked_out: "bg-gray-100 text-gray-700",
  citizen_fire: "bg-amber-100 text-amber-800",
};

const winnerBadge = (winner: string | null) => {
  if (!winner) return <Badge variant="secondary">Unknown</Badge>;
  if (winner.toLowerCase() === "mafia") return <Badge className="bg-red-600 text-white">Mafia</Badge>;
  return <Badge className="bg-blue-600 text-white">Citizens</Badge>;
};

const roleChip = (role: string | null) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
    <Shield className="h-3 w-3" />
    {role ?? "—"}
  </span>
);

// ---------------- Components ----------------

function HeaderCard({ data }: { data: GameResults }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
          <Trophy className="h-6 w-6" /> {data.meta.title}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> {data.meta.player_count} players
          </span>
          <span className="inline-flex items-center gap-2 text-sm">Winner: {winnerBadge(data.meta.winner)}</span>
          <Link to={data.links.full_log} className="inline-flex">
            <Button variant="outline" size="sm" className="gap-2">
              <List className="h-4 w-4" /> View Full Log
            </Button>
          </Link>
        </div>
      </CardHeader>
    </Card>
  );
}

function PlayersTable({ players }: { players: ResultPlayer[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Players</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr className="border-b">
                <th className="py-2 pr-3">Seat</th>
                <th className="py-2 pr-3">Player</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Win rate</th>
                <th className="py-2 pr-3">Terminated</th>
                <th className="py-2">Performance</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const perf = p.performance || {};
                const isMafia = Boolean(
                  p.role_name && ["mafia", "godfather", "killer", "attorney", "punisher", "terrorist"].some((s) => p.role_name!.toLowerCase().includes(s))
                );

                return (
                  <tr key={`${p.player_id}-${p.seat_number ?? "x"}`} className="border-b last:border-0">
                    <td className="py-2 pr-3 align-top">{p.seat_number ?? "—"}</td>
                    <td className="py-2 pr-3 align-top">{p.name}</td>
                    <td className="py-2 pr-3 align-top">{roleChip(p.role_name)}</td>
                    <td className="py-2 pr-3 align-top">{pct(p.overall_win_rate, 0)}</td>
                    <td className="py-2 pr-3 align-top">
                      {p.terminated_round ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                          {p.terminated_phase === "day" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                          Round {p.terminated_round}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Alive at end</span>
                      )}
                    </td>
                    <td className="py-2 align-top">
                      {!isMafia ? (
                        <div className="flex flex-wrap gap-2">
                          <PerfChip label="Correct targets" value={perf.correct_targets_rate} type="percent" />
                          <PerfChip label="Successful contribution" value={perf.successful_contribution_rate} type="percent" />
                          <PerfChip label="Correct covers" value={perf.correct_covers_rate} type="percent" />
                          <PerfChip label="Successful acts" value={perf.successful_acts_count} type="count" />
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <PerfChip label="Pushes" value={perf.pushes_count} type="count" />
                          <PerfChip label="City trust" value={perf.city_trust_rate} type="percent" />
                          <PerfChip label="Successful claim" value={perf.successful_claim ? 1 : 0} type="bool" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function PerfChip({ label, value, type }: { label: string; value: any; type: "percent" | "count" | "bool" }) {
  if (type === "percent") {
    const v = typeof value === "number" ? value : 0;
    return (
      <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-medium">{pct(v, 0)}</span>
      </span>
    );
  }
  if (type === "count") {
    const v = typeof value === "number" ? value : 0;
    return (
      <span className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-medium">{v}</span>
      </span>
    );
  }
  // bool
  const ok = Boolean(value);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 ${ok ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
      <span className="text-xs">{label}</span>
      {ok ? <BadgeCheck className="h-4 w-4" /> : <span className="text-xs">No</span>}
    </span>
  );
}

function Timeline({ timeline }: { timeline: TimelineEvent[] }) {
  // Group by round number
  const rounds = useMemo(() => {
    const m = new Map<number, TimelineEvent[]>();
    for (const ev of timeline) {
      if (!m.has(ev.round_number)) m.set(ev.round_number, []);
      m.get(ev.round_number)!.push(ev);
    }
    // Sort events inside each round: day finalists → day terminations → claims, then night
    for (const [k, arr] of m) {
      arr.sort((a, b) => {
        const phaseA = a.phase_type === "day" ? 0 : 1;
        const phaseB = b.phase_type === "day" ? 0 : 1;
        if (phaseA !== phaseB) return phaseA - phaseB;
        const orderKind = { finalists: 0, termination: 1, claim: 2 } as const;
        return orderKind[a.kind] - orderKind[b.kind];
      });
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [timeline]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {rounds.map(([round, events]) => (
            <div key={round} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Crown className="h-4 w-4" /> Round {round}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {events.map((ev, idx) => (
                  <div key={idx} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between pb-2">
                      <div className="inline-flex items-center gap-2 text-sm font-medium">
                        {ev.phase_type === "day" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span className="capitalize">{ev.phase_type}</span>
                      </div>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{ev.kind}</span>
                    </div>

                    {ev.kind === "finalists" && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Threshold: {ev.payload.threshold} • Alive: {ev.payload.alive}</div>
                        <div className="flex flex-wrap gap-2">
                          {ev.payload.candidates?.length ? (
                            ev.payload.candidates.map((c: any) => (
                              <span key={c.gp_id} className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-sm">
                                <Users className="h-4 w-4" /> {c.player_name}
                                <Badge variant="secondary" className="ml-1">{c.count}</Badge>
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No finalists</span>
                          )}
                        </div>
                      </div>
                    )}

                    {ev.kind === "termination" && (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <Skull className="h-4 w-4" />
                          <span className="font-medium">{ev.payload.player_name}</span>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs ${causeBadgeColor[ev.payload.cause] ?? "bg-muted"}`}>
                            Cause: {ev.payload.cause}
                          </span>
                        </div>
                        {ev.payload.second_vote_counts && (
                          <div className="pt-2">
                            <div className="text-xs text-muted-foreground">Second votes</div>
                            <div className="flex flex-wrap gap-2">
                              {ev.payload.second_vote_counts.map((s: any) => (
                                <span key={s.gp_id} className="inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs">
                                  {s.player_name} <Badge variant="secondary">{s.count}</Badge>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {ev.kind === "claim" && (
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-sm">
                          <BadgeCheck className="h-4 w-4" />
                          <span className="font-medium">{ev.payload.player_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Claimed role: {ev.payload.role_claimed ?? "—"}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------- Page ----------------

export default function ResultsDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const [data, setData] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get<GameResults>(`/games/${gameId}/results/`);
            setData(res.data);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load");
        } finally {
            setLoading(false);
        }
    }
    if (gameId) load();
    return () => {
      active = false;
    };
  }, [gameId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-sm text-red-600">{error ?? "No data"}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      <div className="mb-6">
        <Link
          to="/results"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 my-5" />
          Back to Results
        </Link>
      </div>

      <HeaderCard data={data} />
      <PlayersTable players={data.players} />
      <Timeline timeline={data.timeline} />
    </div>
  );
}
