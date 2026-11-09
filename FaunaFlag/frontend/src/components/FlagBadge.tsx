import { cn } from "@/lib/utils";
import { FLAG_META } from "@/lib/flags";
import type { Flag } from "@/lib/types";

export default function FlagBadge({ flag, className, testId }: { flag: Flag; className?: string; testId?: string }) {
  const m = FLAG_META[flag];
  return (
    <span
      data-testid={testId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em]",
        m.badge,
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: m.hex }} />
      {m.short}
    </span>
  );
}

export function SplitBar({ red, amber, green, className }: { red: number; amber: number; green: number; className?: string }) {
  const total = red + amber + green || 1;
  return (
    <div className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div className="bg-flag-red transition-[width] duration-500" style={{ width: `${(red / total) * 100}%` }} />
      <div className="bg-flag-amber transition-[width] duration-500" style={{ width: `${(amber / total) * 100}%` }} />
      <div className="bg-flag-green transition-[width] duration-500" style={{ width: `${(green / total) * 100}%` }} />
    </div>
  );
}
