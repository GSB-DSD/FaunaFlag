import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FlagBadge, { SplitBar } from "@/components/FlagBadge";
import SuggestFilmDialog from "@/components/SuggestFilmDialog";
import Poster from "@/components/Poster";
import { apiGet } from "@/lib/api";
import { FLAGS, FLAG_META } from "@/lib/flags";
import type { Film, FilmCommunity, Flag } from "@/lib/types";
import { cn } from "@/lib/utils";

const SORTS: Record<string, string> = { title: "Title A–Z", year_desc: "Newest first", year_asc: "Oldest first", severity: "Most severe first" };
const SEVERITY: Record<Flag, number> = { red: 0, amber: 1, green: 2 };

export default function Library() {
  const films = useQuery({ queryKey: ["films"], queryFn: () => apiGet<Film[]>("/films") });
  const community = useQuery({ queryKey: ["community"], queryFn: () => apiGet<FilmCommunity[]>("/films/community") });
  const [q, setQ] = useState("");
  const [flag, setFlag] = useState<Flag | "all">("all");
  const [sort, setSort] = useState("title");
  const [open, setOpen] = useState<string | null>(null);

  const all = films.isError ? [] : films.data ?? [];
  const cmap = useMemo(() => new Map((community.isError ? [] : community.data ?? []).map((c) => [c.film_id, c])), [community.data, community.isError]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = all.filter(
      (f) =>
        (flag === "all" || f.flag === flag) &&
        (!term || f.title.toLowerCase().includes(term) || f.species.some((s) => s.toLowerCase().includes(term)) || f.director.toLowerCase().includes(term)),
    );
    return [...list].sort((a, b) =>
      sort === "year_desc" ? b.year - a.year : sort === "year_asc" ? a.year - b.year : sort === "severity" ? SEVERITY[a.flag] - SEVERITY[b.flag] || a.title.localeCompare(b.title) : a.title.localeCompare(b.title),
    );
  }, [all, q, flag, sort]);

  const counts = useMemo(() => Object.fromEntries(FLAGS.map((f) => [f, all.filter((x) => x.flag === f).length])) as Record<Flag, number>, [all]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">The curated archive</p>
          <h1 className="mt-4 font-heading text-4xl tracking-[-0.03em] sm:text-5xl lg:text-6xl">Animals on film, flagged.</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Every film in the test, with its curated flag and the reasons behind it. Open any card to read the full dossier and see how the community voted.
          </p>
          <div className="mt-6"><SuggestFilmDialog /></div>
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-5 lg:justify-end">
          <FilterPill active={flag === "all"} onClick={() => setFlag("all")} testId="library-filter-all">All · {all.length}</FilterPill>
          {FLAGS.map((f) => (
            <FilterPill key={f} active={flag === f} onClick={() => setFlag(f)} testId={`library-filter-${f}`} color={FLAG_META[f].hex}>
              {FLAG_META[f].short} · {counts[f]}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="sticky top-16 z-30 mt-10 flex flex-col gap-3 border-y border-border bg-background/85 py-4 backdrop-blur-md sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input data-testid="library-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, director or species…" className="h-10 pl-9" />
        </div>
        <Select value={sort} onValueChange={(v: string) => setSort(v)}>
          <SelectTrigger data-testid="library-sort-select" className="h-10 w-full sm:w-52">
            <SelectValue>{(v) => SORTS[v as string]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([k, l]) => (
              <SelectItem key={k} value={k} data-testid={`library-sort-${k}`}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground" data-testid="library-result-count">{shown.length} films</p>

      {films.isLoading && <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-sm bg-panel" />)}</div>}
      {!films.isLoading && shown.length === 0 && (
        <div className="mt-6 rounded-sm border border-dashed border-border p-10 text-center text-muted-foreground" data-testid="library-empty-state">
          {films.isError ? "The archive is offline right now." : "No films match that search."}
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((f) => {
          const c = cmap.get(f.id);
          const isOpen = open === f.id;
          return (
            <article
              key={f.id}
              data-testid={`library-film-card-${f.id}`}
              className="group flex flex-col overflow-hidden rounded-sm border border-border bg-cinema transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-[#3E4552]"
              style={{ borderTopColor: FLAG_META[f.flag].hex, borderTopWidth: 2 }}
            >
              <div className="relative overflow-hidden">
                <Poster src={f.poster_url} title={f.title} year={f.year} testId={`library-film-poster-${f.id}`} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cinema to-transparent" />
                <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                  <span className="rounded-sm bg-background/75 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">{f.genre || "Film"}</span>
                  <FlagBadge flag={f.flag} testId={`library-film-flag-${f.id}`} className="bg-background/80 backdrop-blur" />
                </div>
              </div>
              <div className="flex-1 px-5 pb-4 pt-3">
                <h3 className="font-heading text-xl leading-tight tracking-[-0.01em]" data-testid="library-film-title">{f.title}</h3>
                <p className="mt-1 font-mono text-xs text-gold">{f.year}{f.director && <span className="text-muted-foreground"> · {f.director}</span>}</p>
                <p className={cn("mt-4 text-sm leading-relaxed text-muted-foreground", !isOpen && "line-clamp-3")}>{f.description}</p>
                {isOpen && f.species.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.species.map((s) => <span key={s} className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s}</span>)}
                  </div>
                )}
              </div>
              <div className="border-t border-dashed border-border px-5 py-3">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  <span>Community · {c?.total ?? 0} votes</span>
                  <button type="button" data-testid={`library-film-toggle-${f.id}`} onClick={() => setOpen(isOpen ? null : f.id)} className="text-gold transition-colors hover:text-gold-soft">
                    {isOpen ? "Close" : "Dossier"}
                  </button>
                </div>
                <SplitBar red={c?.red ?? 0} amber={c?.amber ?? 0} green={c?.green ?? 0} className="mt-2" />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function FilterPill({ active, onClick, children, testId, color }: { active: boolean; onClick: () => void; children: React.ReactNode; testId: string; color?: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      data-active={active}
      onClick={onClick}
      className="flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-[color,border-color,background-color] duration-200 hover:text-foreground data-[active=true]:border-gold data-[active=true]:bg-gold/10 data-[active=true]:text-foreground"
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}
