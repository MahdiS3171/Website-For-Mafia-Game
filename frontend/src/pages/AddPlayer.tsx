import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPlayer } from "../lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { listPlayersWithStats, updatePlayer } from "@/lib/api";
import type { PlayerWithStats } from "@/types";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";


const AddPlayer = () => {
  const [name, setName] = useState("");
  const [nickname, setNickName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerWithStats[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  // edit dialog state
  const [editing, setEditing] = useState<PlayerWithStats | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  type SortKey = "name" | "nickname" | "games_played" | "wins" | "win_rate";
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });

  const numericKeys: SortKey[] = ["games_played", "wins", "win_rate"];

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const sortedPlayers = useMemo(() => {
    const arr = [...players];
    const dir = sort.dir === "asc" ? 1 : -1;

    arr.sort((a: any, b: any) => {
      if (numericKeys.includes(sort.key)) {
        const av = Number.isFinite(a[sort.key]) ? Number(a[sort.key]) : 0;
        const bv = Number.isFinite(b[sort.key]) ? Number(b[sort.key]) : 0;
        if (av === bv) return 0;
        return av < bv ? -1 * dir : 1 * dir;
      }
      const av = (a[sort.key] ?? "").toString().toLowerCase();
      const bv = (b[sort.key] ?? "").toString().toLowerCase();
      return av.localeCompare(bv) * dir;
    });

    return arr;
  }, [players, sort]);

  const SortHeader = ({ label, col }: { label: string; col: SortKey }) => {
    const active = sort.key === col;
    const Icon = active ? (sort.dir === "asc" ? ChevronUp : ChevronDown) : ArrowUpDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 hover:text-foreground text-muted-foreground"
        title={`Sort by ${label}`}
      >
        <span className="font-medium text-foreground">{label}</span>
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listPlayersWithStats();
        if (mounted) setPlayers(res.data);
      } catch (e: any) {
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to load players";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        if (mounted) setLoadingPlayers(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const openEdit = (p: PlayerWithStats) => {
    setEditing(p);
    setEditName(p.name ?? "");
    setEditNickname(p.nickname ?? "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const payload = {
        name: editName.trim() || editing.name,
        nickname: editNickname.trim(),
      };
      await updatePlayer(editing.id, payload);
      // update list locally without full refetch
      setPlayers(prev => prev.map(x => x.id === editing.id ? { ...x, ...payload } : x));
      toast({ title: "Player updated" });
      setEditing(null);
    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to update player";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create player
      const newPlayerRes = await createPlayer({ name, nickname });
      toast({
        title: "Player created",
        description: `Added ${newPlayerRes.data.name}${newPlayerRes.data.nickname ? ` (${newPlayerRes.data.nickname})` : ""}`,
      });
      setName("");
      setNickName("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add New Player</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Player name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="string"
                placeholder="nickname"
                value={nickname ?? ""}
                onChange={(e) => setNickName(e.target.value)}
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add Player"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>All Players</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlayers ? (
              <div className="text-sm text-muted-foreground py-6">Loading players…</div>
            ) : players.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6">No players yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm align-middle">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 text-left"><SortHeader label="Name"      col="name" /></th>
                      <th className="py-3 text-left"><SortHeader label="Nickname"  col="nickname" /></th>
                      <th className="py-3 text-left"><SortHeader label="Games"     col="games_played" /></th>
                      <th className="py-3 text-left"><SortHeader label="Wins"      col="wins" /></th>
                      <th className="py-3 text-left"><SortHeader label="Win Rate"  col="win_rate" /></th>
                      <th className="py-3 text-left w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayers.map((p) => (
                      <tr key={p.id} className="border-b last:border-b-0 align-middle">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">{p.nickname || <em>—</em>}</td>
                        <td className="py-3"><Badge variant="outline">{p.games_played}</Badge></td>
                        <td className="py-3"><Badge>{p.wins}</Badge></td>
                        <td className="py-3 text-muted-foreground">
                          {Number.isFinite(p.win_rate) ? `${p.win_rate.toFixed(0)}%` : "—"}
                        </td>
                        <td className="py-3">
                          <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit player</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Name</div>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Player name" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Nickname</div>
                <Input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} placeholder="Nickname (optional)" />
              </div>
            </div>

            <AlertDialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default AddPlayer;
