import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { buttonVariants } from "@/components/ui/button";
import FlagBadge, { SplitBar } from "@/components/FlagBadge";
import ShareCard from "@/components/ShareCard";
import Poster from "@/components/Poster";
import { apiGet } from "@/lib/api";
import { FLAGS, FLAG_META } from "@/lib/flags";
import type { QuizResult } from "@/lib/types";
import { cn } from "@/lib/utils";

function ordinal(n: number) {
  const r = Math.round(n);
  const s = ["th", "st", "nd", "rd"];
  const v = r % 100;
  return r + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function Results() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ["result", id], queryFn: () => apiGet<QuizResult>(`/quiz/results/${id}`), enabled: !!id });
  const r = q.isError ? undefined : q.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">Classification report</p>
      <h1 className="mt-4 font-heading text-4xl tracking-[-0.03em] sm:text-5xl lg:text-6xl" data-testid="results-title">
        {r ? <>You are a <em className="not-italic text-gold" data-testid="results-tolerance-label">{r.tolerance_label}</em>.</> : "Your verdict"}
      </h1>

      {q.isLoading && (
        <div className="flex h-60 items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      )}
      {q.isError && (
        <div className="mt-10 rounded-sm border border-dashed border-border p-10 text-muted-foreground" data-testid="results-error">
          This report couldn't be found.{" "}
          <Link to="/quiz" className="text-gold underline-offset-4 hover:underline">Take the test</Link>
        </div>
      )}

      {r && (
        <>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            You rated {r.total} film{r.total === 1 ? "" : "s"}. You're stricter than{" "}
            <span className="text-foreground">{r.strictness_percentile}%</span> of the {r.submissions_total} participants so far, which puts you in the{" "}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ShareCard result={r} />
            <span className="text-sm text-muted-foreground">Get an image of your breakdown to post anywhere.</span>
          </div>

          <section className="mt-12 grid items-start gap-8 lg:grid-cols-12">
            <div className="rounded-sm border border-border bg-panel p-7 lg:col-span-5" data-testid="results-breakdown-panel">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">What you deem safe</p>
              <div className="relative mx-auto mt-4 h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={FLAGS.map((f) => ({ name: f, value: r.counts[f] }))} dataKey="value" innerRadius={72} outerRadius={100} stroke="#13161A" strokeWidth={3} startAngle={90} endAngle={-270} isAnimationActive>
                      {FLAGS.map((f) => <Cell key={f} fill={FLAG_META[f].hex} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-5xl text-flag-green-soft" data-testid="results-pct-green-hero">{r.percentages.green}%</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">rated safe</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {FLAGS.map((f) => (
                  <div key={f} className="flex items-center justify-between border-b border-dashed border-border pb-3 last:border-0">
                    <FlagBadge flag={f} />
                    <span className="font-mono text-sm" data-testid={`results-pct-${f}`}>
                      {r.percentages[f]}% <span className="text-muted-foreground">· {r.counts[f]}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:col-span-7">
              <Metric label="Agreement with curated flags" value={`${r.agreement_pct}%`} testId="results-agreement" note={`Community average: ${r.community_avg_agreement}%`} />
              <Metric label="Agreement with community majority" value={`${r.community_match_pct}%`} testId="results-community-match" note="How often you voted with the crowd" />
              <Metric label="Strictness index" value={`${r.strictness}`} testId="results-strictness" note="0 = all green · 100 = all red" />
              <Metric label="Strictness percentile" value={ordinal(r.strictness_percentile)} testId="results-percentile" note={`Out of ${r.submissions_total} tests`} />
              <div className="bg-panel p-6 sm:col-span-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">You vs. the community average</p>
                <div className="mt-4 space-y-4">
                  {FLAGS.map((f) => (
                    <div key={f} data-testid={`results-compare-${f}`}>
                      <div className="mb-1.5 flex justify-between font-mono text-[11px]">
                        <span style={{ color: FLAG_META[f].hex }}>{FLAG_META[f].short}</span>
                        <span className="text-muted-foreground">you {r.percentages[f]}% · avg {r.community_avg[f]}%</span>
                      </div>
                      <div className="relative h-2 rounded-full bg-secondary">
                        <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700" style={{ width: `${r.percentages[f]}%`, backgroundColor: FLAG_META[f].hex }} />
                        <div className="absolute -top-1 h-4 w-0.5 bg-foreground" style={{ left: `${r.community_avg[f]}%` }} title="Community average" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-3xl tracking-[-0.02em]">Film-by-film debrief</h2>
              <div className="flex gap-3">
                <Link to="/quiz" data-testid="results-retake-button" className={cn(buttonVariants({ variant: "outline" }), "font-mono text-[11px] uppercase tracking-[0.15em]")}>Retake</Link>
                <Link to="/library" data-testid="results-library-button" className={cn(buttonVariants(), "font-mono text-[11px] uppercase tracking-[0.15em]")}>Explore the archive</Link>
              </div>
            </div>
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full min-w-[640px] text-sm" data-testid="results-debrief-table">
                <thead className="bg-panel font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-normal">Film</th>
                    <th className="px-4 py-3 text-left font-normal">You</th>
                    <th className="px-4 py-3 text-left font-normal">Curated</th>
                    <th className="px-4 py-3 text-left font-normal">Community</th>
                  </tr>
                </thead>
                <tbody>
                  {r.breakdown.map((b) => (
                    <tr key={b.film_id} className="border-t border-border transition-colors hover:bg-panel/60" data-testid={`results-row-${b.film_id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Poster src={b.poster_url} title={b.title} className="w-10 shrink-0 rounded-[2px] ring-1 ring-border [&_span]:hidden [&_svg]:size-3.5" />
                          <div>
                            <span className="font-heading text-base">{b.title}</span>{" "}
                            <span className="font-mono text-xs text-muted-foreground">{b.year}</span>
                            {b.your_flag === b.official_flag && <span className="ml-2 font-mono text-[10px] text-gold">✓ match</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><FlagBadge flag={b.your_flag} /></td>
                      <td className="px-4 py-3"><FlagBadge flag={b.official_flag} /></td>
                      <td className="w-48 px-4 py-3">
                        <SplitBar {...b.community} />
                        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">{b.community_total} votes</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, note, testId }: { label: string; value: string; note: string; testId: string }) {
  return (
    <div className="bg-panel p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-heading text-4xl" data-testid={testId}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}
