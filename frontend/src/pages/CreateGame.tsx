import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createGame, getRoles, bulkAddPlayersToGame, getPlayers } from "../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

type PlayerOption = { id: string; name: string; nickname?: string };
type Row = { player?: PlayerOption; seat_number: number | ""; role_slug: string };
type RoleOption = { id: string; name: string; slug: string; is_mafia: boolean };

export default function CreateGame() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Row[]>([{ player: undefined, seat_number: "", role_slug: "" }]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch roles once
  useEffect(() => {
    getRoles()
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data as any).results;
        setRoles(data || []);
      })
      .catch(() =>
        toast({ title: "Error", description: "Failed to load roles", variant: "destructive" })
      );
  }, [toast]);

  const addRow = () => setRows((p) => [...p, { player: undefined, seat_number: "", role_slug: "" }]);
  const removeRow = (i: number) => setRows((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<Row>) => setRows((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const validate = (): string | null => {
    if (!title.trim()) return "Game title is required";
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.player?.id) return `Row ${i + 1}: choose a player`;
      if (!r.seat_number || isNaN(Number(r.seat_number))) return `Row ${i + 1}: seat number is required`;
      if (!r.role_slug) return `Row ${i + 1}: role is required`;
    }
    const seats = rows.map((r) => Number(r.seat_number));
    if (new Set(seats).size !== seats.length) return "Seat numbers must be unique";
    return null;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: "Fix inputs", description: err, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const gameRes = await createGame({ title, is_active: true });
      const gameId = gameRes.data.id;

      const body = rows.map((r) => ({
        player_id: r.player!.id,
        seat_number: Number(r.seat_number),
        role_slug: r.role_slug,
      }));
      await bulkAddPlayersToGame(gameId, body);

      toast({ title: "Game Ready", description: `“${title}” created and players added.` });
      navigate(`/game/${gameId}`);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.response?.data?.error || "Failed to create game / add players",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link>
        </div>

        <Card>
          <CardHeader><CardTitle>Create Game & Add Players</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleStart} className="space-y-6">
              <Input
                type="text"
                placeholder="Game title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="space-y-4">
                {rows.map((row, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <PlayerPicker
                        value={row.player}
                        onChange={(p) => updateRow(i, { player: p })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Seat #"
                        value={row.seat_number}
                        onChange={(e) => updateRow(i, { seat_number: e.target.value as any })}
                      />
                    </div>
                    <div className="col-span-4">
                      <Select
                        value={row.role_slug}
                        onValueChange={(val) => updateRow(i, { role_slug: val })}
                      >
                        <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.slug}>
                              {r.name} {r.is_mafia ? "(Mafia)" : "(Citizen)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 text-right">
                      {rows.length > 1 && (
                        <Button type="button" variant="outline" onClick={() => removeRow(i)}>✕</Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button type="button" variant="secondary" onClick={addRow}>+ Add Player</Button>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Starting…" : "Start Game"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Searchable existing-players combobox */
function PlayerPicker({
  value,
  onChange,
}: {
  value?: PlayerOption;
  onChange: (p: PlayerOption | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<PlayerOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch players dynamically when searching
  useEffect(() => {
    let active = true;
    setLoading(true);
    getPlayers(query, 50)
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data as any).results;
        const mapped = (data || []).map((p: any) => ({
          id: String(p.id),
          name: p.name,
          nickname: p.nickname,
        }));
        if (active) setOptions(mapped);
      })
      .catch(() => setOptions([]))
      .then(() => setLoading(false));

    return () => {
      active = false;
    };
  }, [query]);

  const label = value ? `${value.name}${value.nickname ? ` (${value.nickname})` : ""}` : "Choose a player";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">{label}</Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px]">
        <Command>
          <CommandInput placeholder="Search players…" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{loading ? "Loading…" : "No players found"}</CommandEmpty>
            <CommandGroup heading="Players">
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  onSelect={() => { onChange(opt); setOpen(false); }}
                >
                  {opt.name}{opt.nickname ? ` (${opt.nickname})` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
