import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ImageIcon, Inbox, Loader2, Lock, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FlagBadge from "@/components/FlagBadge";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { FLAGS, FLAG_META } from "@/lib/flags";
import type { AdminStatus, Film, FilmInput, Flag, PosterLookup, ReseedResult, Suggestion } from "@/lib/types";
import Poster from "@/components/Poster";

const EMPTY: FilmInput = { title: "", year: new Date().getFullYear(), director: "", genre: "", species: [], description: "", flag: "green", poster_url: "" };

export default function Admin() {
  const me = useQuery({ queryKey: ["admin-me"], queryFn: () => apiGet<AdminStatus>("/admin/me") });
  const authed = !me.isError && me.data?.authenticated;
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">Restricted · Archive terminal</p>
      <h1 className="mt-4 font-heading text-4xl tracking-[-0.03em] sm:text-5xl">Manage the archive</h1>
      {authed ? <Manager /> : <PinGate loading={me.isLoading} />}
    </div>
  );
}

function PinGate({ loading }: { loading: boolean }) {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const login = useMutation({
    mutationFn: () => apiPost<AdminStatus>("/admin/login", { pin }),
    onSuccess: () => {
      toast.success("Access granted");
      qc.invalidateQueries({ queryKey: ["admin-me"] });
    },
    onError: () => toast.error("Incorrect PIN"),
  });
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); login.mutate(); }}
      className="mt-10 max-w-sm rounded-sm border border-border bg-panel p-7"
      data-testid="admin-pin-form"
    >
      <Lock className="size-5 text-gold" />
      <Label htmlFor="pin" className="mt-4 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admin PIN</Label>
      <Input id="pin" type="password" autoComplete="current-password" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-2 h-11 font-mono tracking-[0.3em]" data-testid="admin-pin-input" />
      <Button type="submit" className="mt-4 w-full font-mono text-[11px] uppercase tracking-[0.18em]" disabled={!pin || login.isPending || loading} data-testid="admin-pin-submit-button">
        Unlock
      </Button>
    </form>
  );
}

function Manager() {
  const qc = useQueryClient();
  const films = useQuery({ queryKey: ["films"], queryFn: () => apiGet<Film[]>("/films") });
  const [editing, setEditing] = useState<Film | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Film | null>(null);
  const [filter, setFilter] = useState("");
  const [approving, setApproving] = useState<Suggestion | null>(null);
  const suggestions = useQuery({ queryKey: ["suggestions"], queryFn: () => apiGet<Suggestion[]>("/suggestions?status=pending") });
  const pending = suggestions.isError ? [] : suggestions.data ?? [];

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["films"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["community"] });
  };
  const onAuthError = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) qc.invalidateQueries({ queryKey: ["admin-me"] });
    toast.error("Action failed");
  };

  const save = useMutation({
    mutationFn: (data: { id?: string; body: FilmInput }) => (data.id ? apiPut<Film>(`/films/${data.id}`, data.body) : apiPost<Film>("/films", data.body)),
    onSuccess: (_, v) => { toast.success(v.id ? "Film updated" : "Film added"); setEditing(null); setCreating(false); refresh(); },
    onError: onAuthError,
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/films/${id}`),
    onSuccess: () => { toast.success("Film deleted"); setToDelete(null); refresh(); },
    onError: onAuthError,
  });
  const reseed = useMutation({
    mutationFn: () => apiPost<ReseedResult>("/admin/reseed"),
    onSuccess: (r) => { toast.success(`Default films restored · ${r.films_total} in archive`); refresh(); },
    onError: onAuthError,
  });
  const approve = useMutation({
    mutationFn: (d: { id: string; body: FilmInput }) => apiPost<Film>(`/suggestions/${d.id}/approve`, d.body),
    onSuccess: (f) => { toast.success(`"${f.title}" added to the archive`); setApproving(null); refresh(); qc.invalidateQueries({ queryKey: ["suggestions"] }); },
    onError: onAuthError,
  });
  const reject = useMutation({
    mutationFn: (id: string) => apiPost<Suggestion>(`/suggestions/${id}/reject`),
    onSuccess: () => { toast.success("Suggestion rejected"); qc.invalidateQueries({ queryKey: ["suggestions"] }); },
    onError: onAuthError,
  });
  const logout = useMutation({
    mutationFn: () => apiPost<AdminStatus>("/admin/logout"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-me"] }),
  });

  const list = (films.isError ? [] : films.data ?? []).filter((f) => f.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Tabs defaultValue="films" className="mt-10">
      <TabsList variant="line" className="mb-6">
        <TabsTrigger value="films" data-testid="admin-tab-films">Films</TabsTrigger>
        <TabsTrigger value="suggestions" data-testid="admin-tab-suggestions">
          Suggestions
          {pending.length > 0 && <span className="ml-1.5 rounded-sm bg-gold px-1.5 font-mono text-[10px] text-[#0B0C0E]" data-testid="admin-suggestions-count">{pending.length}</span>}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="films">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by title…" className="h-10 sm:w-72" data-testid="admin-filter-input" />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreating(true)} data-testid="admin-add-film-button" className="font-mono text-[11px] uppercase tracking-[0.15em]"><Plus className="size-4" /> Add film</Button>
          <Button variant="outline" onClick={() => reseed.mutate()} disabled={reseed.isPending} data-testid="admin-reseed-button" className="font-mono text-[11px] uppercase tracking-[0.15em]"><RotateCcw className="size-4" /> Restore defaults</Button>
          <Button variant="ghost" onClick={() => logout.mutate()} data-testid="admin-logout-button" className="font-mono text-[11px] uppercase tracking-[0.15em]">Lock</Button>
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-border bg-panel">
        <Table data-testid="admin-films-table">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="hidden md:table-cell">Species</TableHead>
              <TableHead>Flag</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((f) => (
              <TableRow key={f.id} data-testid={`admin-film-row-${f.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Poster src={f.poster_url} title={f.title} className="w-9 shrink-0 rounded-[2px] ring-1 ring-border [&_span]:hidden [&_svg]:size-3" testId={`admin-film-poster-${f.id}`} />
                    <span className="font-heading text-base">{f.title}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{f.year}</TableCell>
                <TableCell className="hidden max-w-[220px] truncate text-xs text-muted-foreground md:table-cell">{f.species.join(", ")}</TableCell>
                <TableCell><FlagBadge flag={f.flag} /></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(f)} data-testid={`admin-edit-${f.id}`} aria-label="Edit"><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setToDelete(f)} data-testid={`admin-delete-${f.id}`} aria-label="Delete"><Trash2 className="size-4 text-flag-red-soft" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </TabsContent>

      <TabsContent value="suggestions">
        {pending.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-12 text-center text-muted-foreground" data-testid="admin-suggestions-empty">
            <Inbox className="mx-auto mb-3 size-6" /> No suggestions waiting for review.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((s) => (
              <article key={s.id} className="flex flex-col rounded-sm border border-border bg-cinema p-5" data-testid={`admin-suggestion-${s.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl">{s.title} <span className="font-mono text-sm text-gold">{s.year}</span></h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.director && <>{s.director} · </>}Suggested by {s.submitter_name || "anonymous"} · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <FlagBadge flag={s.suggested_flag} />
                </div>
                {s.species.length > 0 && <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.species.join(" · ")}</p>}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/85">{s.description}</p>
                <div className="mt-4 flex gap-2 border-t border-dashed border-border pt-4">
                  <Button size="sm" onClick={() => setApproving(s)} data-testid={`admin-suggestion-approve-${s.id}`}><Check className="size-4" /> Review & approve</Button>
                  <Button size="sm" variant="ghost" disabled={reject.isPending} onClick={() => reject.mutate(s.id)} data-testid={`admin-suggestion-reject-${s.id}`}><X className="size-4" /> Reject</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </TabsContent>

      <FilmDialog
        key={approving ? `approve-${approving.id}` : "approve-closed"}
        open={!!approving}
        initial={approving ? { title: approving.title, year: approving.year, director: approving.director, genre: "", species: approving.species, description: approving.description, flag: approving.suggested_flag, poster_url: "" } : EMPTY}
        title="Approve suggestion"
        pending={approve.isPending}
        onClose={() => setApproving(null)}
        onSave={(body) => approving && approve.mutate({ id: approving.id, body })}
      />

      <FilmDialog
        key={editing?.id ?? (creating ? "new" : "closed")}
        open={creating || !!editing}
        initial={editing ?? EMPTY}
        title={editing ? "Edit film" : "Add film"}
        pending={save.isPending}
        onClose={() => { setEditing(null); setCreating(false); }}
        onSave={(body) => save.mutate({ id: editing?.id, body })}
      />

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent data-testid="admin-delete-dialog">
          <DialogHeader><DialogTitle className="font-heading text-2xl">Delete “{toDelete?.title}”?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This removes the film and its community votes. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setToDelete(null)} data-testid="admin-delete-cancel-button">Cancel</Button>
            <Button variant="destructive" disabled={del.isPending} onClick={() => toDelete && del.mutate(toDelete.id)} data-testid="admin-delete-confirm-button">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

function FilmDialog({ open, initial, title, pending, onClose, onSave }: { open: boolean; initial: FilmInput; title: string; pending: boolean; onClose: () => void; onSave: (b: FilmInput) => void }) {
  const [form, setForm] = useState<FilmInput>(initial);
  const [species, setSpecies] = useState(initial.species.join(", "));
  const set = <K extends keyof FilmInput>(k: K, v: FilmInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.title.trim() && form.description.trim() && form.year >= 1880 && form.year <= 2100;
  const lookup = useMutation({
    mutationFn: () => apiGet<PosterLookup>(`/posters/lookup?title=${encodeURIComponent(form.title.trim())}&year=${form.year}`),
    onSuccess: (r) => {
      if (r.poster_url) { set("poster_url", r.poster_url); toast.success("Poster found"); }
      else toast.error("No poster found. Paste an image link instead.");
    },
    onError: () => toast.error("Poster lookup failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="admin-film-dialog">
        <DialogHeader><DialogTitle className="font-heading text-2xl">{title}</DialogTitle></DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onSave({ ...form, title: form.title.trim(), species: species.split(",").map((s) => s.trim()).filter(Boolean) });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <Field label="Title"><Input value={form.title} onChange={(e) => set("title", e.target.value)} data-testid="film-form-title-input" /></Field>
            <Field label="Year"><Input type="number" value={form.year} onChange={(e) => set("year", Number(e.target.value))} data-testid="film-form-year-input" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Director"><Input value={form.director} onChange={(e) => set("director", e.target.value)} data-testid="film-form-director-input" /></Field>
            <Field label="Genre"><Input value={form.genre} onChange={(e) => set("genre", e.target.value)} data-testid="film-form-genre-input" /></Field>
          </div>
          <Field label="Species (comma separated)"><Input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Dog, Horse" data-testid="film-form-species-input" /></Field>
          <Field label="Animal treatment dossier"><Textarea rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="film-form-description-input" /></Field>
          <Field label="Poster image link">
            <div className="flex gap-3">
              <Poster key={form.poster_url} src={form.poster_url} title={form.title || "No poster"} className="w-16 shrink-0 rounded-sm ring-1 ring-border [&_span]:hidden" testId="film-form-poster-preview" />
              <div className="grid flex-1 content-start gap-2">
                <Input value={form.poster_url} onChange={(e) => set("poster_url", e.target.value.trim())} placeholder="https://… (leave empty to find it automatically)" data-testid="film-form-poster-input" />
                <Button type="button" variant="outline" size="sm" className="justify-self-start" disabled={!form.title.trim() || lookup.isPending} onClick={() => lookup.mutate()} data-testid="film-form-find-poster-button">
                  {lookup.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />} Find poster
                </Button>
              </div>
            </div>
          </Field>
          <Field label="Curated flag">
            <Select value={form.flag} onValueChange={(v: string) => set("flag", v as Flag)}>
              <SelectTrigger className="w-full" data-testid="film-form-flag-select"><SelectValue>{(v) => FLAG_META[v as Flag]?.label}</SelectValue></SelectTrigger>
              <SelectContent>
                {FLAGS.map((f) => <SelectItem key={f} value={f} data-testid={`film-form-flag-${f}`}>{FLAG_META[f].label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} data-testid="film-form-cancel-button">Cancel</Button>
            <Button type="submit" disabled={!valid || pending} data-testid="film-form-save-button">Save film</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
