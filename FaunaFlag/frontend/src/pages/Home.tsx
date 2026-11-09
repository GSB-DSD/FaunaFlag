import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import FlagBadge, { SplitBar } from "@/components/FlagBadge";
import { apiGet } from "@/lib/api";
import { FLAGS, FLAG_META, LAST_RESULT_KEY } from "@/lib/flags";
import type { CommunityStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Home() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: () => apiGet<CommunityStats>("/stats") });
  const s = stats.isError ? undefined : stats.data;
  const last = typeof window !== "undefined" ? localStorage.getItem(LAST_RESULT_KEY) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <section className="grid items-start gap-14 lg:grid-cols-12">
        <div className="animate-reel-in lg:col-span-7">
          <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-gold">A Bechdel test for the animals</p>
          <h1 className="font-heading text-5xl leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl" data-testid="home-hero-title">
            Would you call it <em className="text-gold not-italic">safe</em> for the animals?
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            You'll be shown films one at a time, each with a short dossier on how its animals were portrayed and treated.
            Give each one a red, amber or green flag. At the end you'll get a percentile breakdown of your own line on cruelty,
            and see how it compares with the curated archive and with everyone else who has taken the test.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/quiz" data-testid="home-start-test-button" className={cn(buttonVariants({ size: "lg" }), "group h-12 px-6 font-mono text-xs uppercase tracking-[0.18em]")}>
              Begin the test <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link to="/library" data-testid="home-library-button" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6 font-mono text-xs uppercase tracking-[0.18em]")}>
              Browse the archive
            </Link>
            {last && (
              <Link to={`/results/${last}`} data-testid="home-last-result-link" className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground underline-offset-4 hover:text-gold hover:underline">
                View my last result
              </Link>
            )}
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-3">
            {FLAGS.map((f) => (
              <div key={f} className="bg-panel p-5" data-testid={`home-criteria-${f}`}>
                <FlagBadge flag={f} />
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{FLAG_META[f].definition}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="animate-reel-in lg:col-span-5 lg:mt-10" style={{ animationDelay: "120ms" }}>
          <div className="rounded-sm border border-border bg-panel/80 p-7 shadow-2xl shadow-black/50 backdrop-blur">
            <div className="flex items-center justify-between border-b border-dashed border-border pb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Community Index</span>
              <span className="text-gold">Live</span>
            </div>
            <dl className="grid grid-cols-2 gap-6 py-6">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tests taken</dt>
                <dd className="mt-1 font-heading text-4xl" data-testid="home-stat-submissions">{s?.submissions_total ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Films archived</dt>
                <dd className="mt-1 font-heading text-4xl" data-testid="home-stat-films">{s?.films_total ?? "—"}</dd>
              </div>
            </dl>
            <div className="space-y-5">
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Average participant verdict</p>
                <SplitBar red={s?.avg_percentages.red ?? 0} amber={s?.avg_percentages.amber ?? 0} green={s?.avg_percentages.green ?? 0} className="h-2.5" />
                <div className="mt-2 flex justify-between font-mono text-[11px]" data-testid="home-stat-avg-split">
                  <span className="text-flag-red-soft">{s?.avg_percentages.red ?? 0}%</span>
                  <span className="text-flag-amber-soft">{s?.avg_percentages.amber ?? 0}%</span>
                  <span className="text-flag-green-soft">{s?.avg_percentages.green ?? 0}%</span>
                </div>
              </div>
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Curated archive split</p>
                <SplitBar red={s?.official_split.red ?? 0} amber={s?.official_split.amber ?? 0} green={s?.official_split.green ?? 0} className="h-2.5" />
              </div>
              <p className="border-t border-dashed border-border pt-4 text-sm text-muted-foreground">
                Average agreement with the curated flags:{" "}
                <span className="font-mono text-foreground" data-testid="home-stat-agreement">{s?.avg_agreement ?? 0}%</span>
              </p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
