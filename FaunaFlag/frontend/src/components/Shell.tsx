import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Film as FilmIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/quiz", label: "The Test", id: "nav-test-link" },
  { to: "/library", label: "Archive", id: "nav-library-link" },
  { to: "/admin", label: "Admin", id: "nav-admin-link" },
];

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="vignette flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" data-testid="nav-logo-link" className="group flex items-center gap-2.5">
            <FilmIcon className="size-5 text-gold transition-transform duration-500 group-hover:rotate-90" />
            <span className="font-mono text-sm font-bold tracking-[0.3em]">FAUNAFLAG</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-4">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.id}
                className={({ isActive }) =>
                  cn(
                    "hidden px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors sm:block",
                    isActive ? "text-gold" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/quiz" data-testid="nav-start-test-button" className={cn(buttonVariants({ size: "sm" }), "font-mono text-[11px] uppercase tracking-[0.15em]")}>
              Start Test
            </Link>
          </nav>
        </div>
        <nav className="flex justify-center gap-6 border-t border-border/40 py-2 sm:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} data-testid={`${n.id}-mobile`} className={({ isActive }) => cn("font-mono text-[10px] uppercase tracking-[0.18em]", isActive ? "text-gold" : "text-muted-foreground")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="relative z-10 flex-1">{children}</main>
      <footer className="relative z-10 border-t border-border/60 py-10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 text-sm text-muted-foreground sm:px-6 md:grid-cols-[2fr_1fr] lg:px-8">
          <p className="max-w-xl leading-relaxed">
            <span className="font-heading text-base text-foreground">FaunaFlag</span> is a Bechdel-style test for how animals are treated
            on and off screen. Curated flags are editorial opinions based on widely reported production accounts. They are not legal findings.
          </p>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] md:text-right">Reel 01 · Est. {new Date().getFullYear()}</p>
        </div>
      </footer>
      <Toaster richColors />
    </div>
  );
}
