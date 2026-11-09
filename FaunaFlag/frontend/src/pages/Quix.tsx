import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Poster from "@/components/Poster";
import { apiGet, apiPost } from "@/lib/api";
import { FLAGS, FLAG_META, LAST_RESULT_KEY } from "@/lib/flags";
import type { Film, Flag, QuizAnswer, SubmitResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "quick", count: 10, label: "Quick Reel", sub: "10 random films · ~3 min" },
  { id: "standard", count: 20, label: "Feature", sub: "20 random films · ~6 min" },
  { id: "full", count: 500, label: "Full Archive", sub: "Every film in the archive" },
] as const;

export default function Quiz() {
  const [count, setCount] = useState<number | null>(null);
  const [seed, setSeed] = useState(0);
  return count === null ? (
    <ModePicker onPick={(c) => { setCount(c); setSeed((s) => s + 1); }} />
  ) : (
    <QuizRun key={seed} count={count} onRestart={() => setCount(null)} />
  );
}

function ModePicker({ onPick }: { onPick: (count: number) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">Slate 00 · Choose your reel</p>
      <h1 className="mt-4 font-heading text-4xl tracking-[-0.03em] sm:text-5xl">How long a screening?</h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Judge each film on how its animals were treated, both on screen and behind the camera. There are no right answers.
        This test measures <em>your</em> line.
      </p>
      <div className="mt-10 grid gap-4">
        {MODES.map((m, i) => (
          <button
            key={m.id}
            type="button"
            data-testid={`quiz-mode-${m.id}-button`}
            onClick={() => onPick(m.count)}
            className="group flex animate-reel-in items-center justify-between rounded-sm border border-border bg-panel p-6 text-left transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-gold/60"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div>
              <p className="font-heading text-2xl">{m.label}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{m.sub}</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-gold">0{i + 1} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizRun({ count, onRestart }: { count: number; onRestart: () => void }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const films = useQuery({
    queryKey: ["quiz-films", count],
    queryFn: () => apiGet<Film[]>(`/quiz/films?count=${count}`),
    staleTime: Infinity,
    gcTime: 0,
  });
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Flag>>({});

  const submit = useMutation({
    mutationFn: (payload: QuizAnswer[]) => apiPost<SubmitResponse>("/quiz/submit", { answers: payload }),
    onSuccess: (res) => {
      localStorage.setItem(LAST_RESULT_KEY, res.id);
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["community"] });
      navigate(`/results/${res.id}`);
    },
    onError: () => toast.error("Couldn't submit your results. Please try again."),
  });

  const list = films.isError ? [] : films.data ?? [];
  const film = list[idx];
  const answered = Object.keys(answers).length;

  const finish = useCallback(
    (final: Record<string, Flag>) => {
      const payload = Object.entries(final).map(([film_id, flag]) => ({ film_id, flag }));
      if (payload.length === 0) {
        toast.error("Rate at least one film to see results.");
        return;
      }
      submit.mutate(payload);
    },
    [submit],
  );

  const choose = useCallback(
    (flag: Flag) => {
      if (!film || submit.isPending) return;
      const next = { ...answers, [film.id]: flag };
      setAnswers(next);
      if (idx + 1 >= list.length) finish(next);
      else setIdx(idx + 1);
    },
    [film, answers, idx, list.length, finish, submit.isPending],
  );

  const skip = useCallback(() => {
    if (submit.isPending) return;
    if (idx + 1 >= list.length) finish(answers);
    else setIdx(idx + 1);
  }, [idx, list.length, finish, answers, submit.isPending]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === "1" || k === "r") choose("red");
      else if (k === "2" || k === "a") choose("amber");
      else if (k === "3" || k === "g") choose("green");
      else if (k === " ") { e.preventDefault(); skip(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, skip]);

  const progress = list.length ? (idx / list.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
      <div className="mb-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <button type="button" onClick={onRestart} data-testid="quiz-change-mode-button" className="transition-colors hover:text-foreground">
          ← Change reel
        </button>
        <span data-testid="quiz-progress-counter">
          Film <span className="text-foreground">{list.length ? Math.min(idx + 1, list.length) : 0}</span> of {list.length}
        </span>
      </div>
      <div className="mb-10 h-px w-full bg-border">
        <div className="h-px bg-gold transition-[width] duration-500 ease-in-out" style={{ width: `${progress}%` }} data-testid="quiz-progress-bar" />
      </div>

      {films.isLoading && (
        <div className="flex h-80 items-center justify-center text-muted-foreground" data-testid="quiz-loading">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}
      {(films.isError || (!films.isLoading && list.length === 0)) && (
        <div className="rounded-sm border border-dashed border-border p-10 text-center text-muted-foreground" data-testid="quiz-empty-state">
          The projector is offline. No films are available right now.
        </div>
      )}

      {film && (
        <article key={film.id} className="animate-reel-in rounded-sm border border-border bg-cinema shadow-2xl shadow-black/60" data-testid="quiz-film-card">
          <div className="flex items-center justify-between border-b border-dashed border-border px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:px-8">
            <span>Slate {String(idx + 1).padStart(2, "0")}</span>
            <span>{film.genre}</span>
          </div>
          <div className="grid gap-6 px-6 py-8 sm:grid-cols-[180px_1fr] sm:gap-8 sm:px-8 sm:py-10">
            <Poster src={film.poster_url} title={film.title} year={film.year} testId="quiz-film-poster" className="mx-auto w-40 rounded-sm shadow-xl shadow-black/60 ring-1 ring-border sm:mx-0 sm:w-full" />
            <div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h2 className="font-heading text-3xl leading-tight tracking-[-0.02em] sm:text-4xl" data-testid="quiz-film-title">{film.title}</h2>
              <span className="font-mono text-sm text-gold" data-testid="quiz-film-year">{film.year}</span>
            </div>
            {film.director && <p className="mt-2 text-sm text-muted-foreground">Directed by {film.director}</p>}
            {film.species.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {film.species.map((sp) => (
                  <span key={sp} className="rounded-sm bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{sp}</span>
                ))}
              </div>
            )}
            <div className="mt-8 border-l-2 border-gold/50 pl-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold">Animal depiction dossier</p>
              <p className="text-[17px] leading-relaxed text-foreground/90" data-testid="quiz-film-description">{film.description}</p>
            </div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-3 sm:p-6">
            {FLAGS.map((f, i) => (
              <button
                key={f}
                type="button"
                data-testid={`flag-btn-${f}`}
                data-active={answers[film.id] === f}
                disabled={submit.isPending}
                onClick={() => choose(f)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-sm border px-4 py-4 text-left transition-[background-color,border-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50",
                  FLAG_META[f].button,
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.18em]">{FLAG_META[f].label}</span>
                  <kbd className="font-mono text-[10px] opacity-60">{i + 1}</kbd>
                </span>
                <span className="text-xs leading-snug opacity-80">{FLAG_META[f].definition}</span>
              </button>
            ))}
          </div>
        </article>
      )}

      {film && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" data-testid="quiz-back-button" disabled={idx === 0 || submit.isPending} onClick={() => setIdx(idx - 1)} className="font-mono text-[11px] uppercase tracking-[0.15em]">
            <ArrowLeft className="size-3.5" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {answered > 0 && idx + 1 < list.length && (
              <Button variant="outline" size="sm" data-testid="quiz-finish-early-button" disabled={submit.isPending} onClick={() => finish(answers)} className="font-mono text-[11px] uppercase tracking-[0.15em]">
                Finish now ({answered})
              </Button>
            )}
            <Button variant="ghost" size="sm" data-testid="quiz-skip-button" disabled={submit.isPending} onClick={skip} className="font-mono text-[11px] uppercase tracking-[0.15em]">
              {submit.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <SkipForward className="size-3.5" />} Haven't seen it / Skip
            </Button>
          </div>
        </div>
      )}
      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">Keys: 1 / R · 2 / A · 3 / G · Space to skip</p>
    </div>
  );
}
