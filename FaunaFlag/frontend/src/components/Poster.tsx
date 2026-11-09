import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

/** Film poster with a typographic fallback when there is no image or it fails to load. */
export default function Poster({ src, title, year, className, testId }: { src?: string; title: string; year?: number; className?: string; testId?: string }) {
  const [failed, setFailed] = useState(false);
  const show = !!src && !failed;
  return (
    <div className={cn("relative aspect-[2/3] overflow-hidden bg-secondary", className)} data-testid={testId}>
      {show ? (
        <img
          src={src}
          alt={`${title} poster`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#1F242C] to-[#13161A] p-3 text-center">
          <Clapperboard className="size-5 text-gold/70" />
          <span className="line-clamp-3 font-heading text-sm leading-tight text-foreground/80">{title}</span>
          {year && <span className="font-mono text-[10px] text-muted-foreground">{year}</span>}
        </div>
      )}
    </div>
  );
}
