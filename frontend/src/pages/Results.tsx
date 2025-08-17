// src/pages/Results.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Calendar, Users } from "lucide-react";

import { getGames, getGameResult } from "@/lib/api";
import type { GameResponse } from "@/types";
import type { GameResultPayload, GameResultLog } from "@/lib/api";

const tagLabel = (slug?: string | null) => {
  if (!slug) return undefined;
  const map: Record<string, string> = {
    target: "Target",
    guard: "Guard",
    save: "Save",
    mafia_suggest: "Mafia Suggest",
    city_saviour: "City Saviour",
    city_suggest: "City Suggest",
    killer_kill: "Killer Kill",
    defense: "Defense",
    side: "Side",
  };
  return map[slug] || slug.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const phaseBadgeVariant = (p: string) => (p === "day" ? "default" : "secondary");

function formatLogLine(log: GameResultLog) {
  const parts: string[] = [];

  // Action name + phase/round/turn
  parts.push(log.action_name);
  const meta: string[] = [];
  meta.push(`${log.phase} r${log.round_number}`);
  if (log.turn_index != null) meta.push(`turn ${log.turn_index}`);
  parts.push(`(${meta.join(" · ")})`);

  // Claim
  if (log.action_slug === "claim" && log.details?.role_slug) {
    parts.push(`→ claimed role: ${String(log.details.role_slug)}`);
  }

  // Votes
  if (log.action_slug === "first_vote" || log.action_slug === "second_vote") {
    const n = Number(log.details?.n ?? log.targets?.length ?? 0);
    const voters = log.targets?.map((t) => `${t.seat}.${t.name}`).join(", ");
    parts.push(`→ ${n} voter${n === 1 ? "" : "s"}${n ? `: ${voters}` : ""}`);
  }

  // K-of-N
  if (typeof log.details?.k === "number" && typeof log.details?.n === "number") {
    parts.push(`→ ${log.details.k}/${log.details.n}`);
  }

  // Will (composite via details; may be empty)
  if (log.action_slug === "will") {
    const t = (Array.isArray(log.details?.target) ? log.details.target : []).map(String);
    const c = (Array.isArray(log.details?.cover) ? log.details.cover : []).map(String);
    const r = log.details?.claim_role;
    const chunks: string[] = [];
    if (t.length) chunks.push(`Targets: ${t.join(", ")}`);
    if (c.length) chunks.push(`Covers: ${c.join(", ")}`);
    if (r) chunks.push(`Claimed: ${r}`);
    if (!chunks.length) chunks.push("Empty will");
    parts.push(`→ ${chunks.join(" | ")}`);
  }

  // Defense cover (if present in details)
  if (log.action_slug === "cover_defense") {
    const who = log.details?.coverer ? `Coverer: ${log.details.coverer}` : "";
    const ts =
      Array.isArray(log.details?.targets) && log.details.targets.length
        ? `Targets: ${log.details.targets.join(", ")}`
        : "";
    const cs =
      Array.isArray(log.details?.covered) && log.details.covered.length
        ? `Covered: ${log.details.covered.join(", ")}`
        : "";
    const chunks = [who, ts, cs].filter(Boolean);
    if (chunks.length) parts.push(`→ ${chunks.join(" | ")}`);
  }

  // Otherwise show tagged targets
  if (log.targets?.length) {
    const tgtTxt = log.targets
      .map((t) => {
        const label = tagLabel(t.tag);
        return `${label ? `${label}: ` : ""}${t.seat}.${t.name}`;
      })
      .join(" | ");
    parts.push(`→ ${tgtTxt}`);
  }

  return parts.join(" ");
}

const Results = () => {
  const { gameId } = useParams<{ gameId: string }>();

  // List view
  const [games, setGames] = useState<GameResponse[]>([]);
  // Single game view
  const [payload, setPayload] = useState<GameResultPayload | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (gameId) {
          // Single game result (uses compact endpoint)
          const res = await getGameResult(gameId);
          setPayload(res.data);
        } else {
          // Completed games list
          const gamesRes = await getGames();
          const completed = gamesRes.data.filter((g) => !g.is_active);
          setGames(completed);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    })();
  }, [gameId]);

  // =====================
  // Loading / Error States
  // =====================
  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  // =====================
  // Game List View
  // =====================
  if (!gameId) {
    if (games.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No completed games found</p>
          <p>Complete some games to see results here!</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Completed Games</h1>
            <p className="text-muted-foreground">Select a game to view detailed results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g) => (
              <Card key={g.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{g.title || `Game #${g.id}`}</CardTitle>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(g.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                    <span className="inline-flex items-center">
                      <Users className="w-4 h-4 mr-1" /> {g.players?.length || 0} players
                    </span>
                    {g.winner ? (
                      <span className="inline-flex items-center">
                        <Trophy className="w-4 h-4 mr-1" />
                        {g.winner}
                      </span>
                    ) : null}
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/games/${g.id}/results`}>View results</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // Single Game Results View (columns per player)
  // =====================
  const players = payload?.players ?? [];

  // Partition logs by actor (player column)
  const logsByPlayer = useMemo(() => {
    const map: Record<string, GameResultLog[]> = {};
    (payload?.logs ?? []).forEach((l) => {
      const k = String(l.game_player);
      (map[k] ||= []).push(l);
    });
    // Sort each column by phase -> round -> turn -> created
    Object.values(map).forEach((list) => {
      list.sort((a, b) => {
        const p = a.phase === b.phase ? 0 : a.phase === "day" ? -1 : 1;
        if (p !== 0) return p;
        if (a.round_number !== b.round_number) return a.round_number - b.round_number;
        const ta = a.turn_index ?? Number.MAX_SAFE_INTEGER;
        const tb = b.turn_index ?? Number.MAX_SAFE_INTEGER;
        if (ta !== tb) return ta - tb;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    return map;
  }, [payload]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/results"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{payload?.game.title || `Game #${payload?.game.id}`}</h1>
          <p className="text-muted-foreground">
            {payload?.game.winner ? (
              <span className="inline-flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Winner: {payload.game.winner}
              </span>
            ) : (
              "Winner not set"
            )}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Actions by Player</CardTitle>
            <CardDescription>Each column is a player; rows are their actions in order</CardDescription>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">No players found for this game.</div>
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="min-w-[720px] grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${players.length || 1}, minmax(220px, 1fr))` }}
                >
                  {players.map((pl) => {
                    const col = logsByPlayer[String(pl.id)] ?? [];
                    return (
                      <div key={pl.id} className="border rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold">
                              {pl.seat_number}. {pl.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{pl.role_name ?? "—"}</div>
                          </div>
                          <Badge variant={pl.is_mafia ? "destructive" : "secondary"}>
                            {pl.is_mafia ? "Mafia" : "Citizen"}
                          </Badge>
                        </div>

                        {col.length === 0 ? (
                          <div className="text-sm text-muted-foreground italic">No actions</div>
                        ) : (
                          <ul className="space-y-2">
                            {col.map((log) => (
                              <li key={log.id} className="rounded-lg border px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <Badge variant={phaseBadgeVariant(log.phase)}>
                                    {log.phase} · r{log.round_number}
                                    {log.turn_index != null ? ` · t${log.turn_index}` : ""}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm">{formatLogLine(log)}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optional: Chronological Table (if you also want a flat log below) */}
        {/* Remove this block if you don’t want the flat table */}
        {payload?.logs?.length ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Chronological Log (All Actors)</CardTitle>
              <CardDescription>Ordered by phase → round → turn → time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Turn</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details / Targets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(payload.logs ?? [])]
                      .sort((a, b) => {
                        const p = a.phase === b.phase ? 0 : a.phase === "day" ? -1 : 1;
                        if (p !== 0) return p;
                        if (a.round_number !== b.round_number) return a.round_number - b.round_number;
                        const ta = a.turn_index ?? Number.MAX_SAFE_INTEGER;
                        const tb = b.turn_index ?? Number.MAX_SAFE_INTEGER;
                        if (ta !== tb) return ta - tb;
                        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                      })
                      .map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.created_at).toLocaleTimeString()}</TableCell>
                          <TableCell className="capitalize">{log.phase}</TableCell>
                          <TableCell>{log.round_number}</TableCell>
                          <TableCell>{log.turn_index ?? "—"}</TableCell>
                          <TableCell>
                            {log.actor_seat}. {log.actor_name}
                          </TableCell>
                          <TableCell>{log.action_name}</TableCell>
                          <TableCell className="whitespace-pre-wrap">{formatLogLine(log)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default Results;
