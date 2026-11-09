import { useEffect, useRef, useState } from "react";
import { Copy, Download, Loader2, Share2 } from "lucide-react";
import { SiFacebook, SiX } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FLAGS, FLAG_META } from "@/lib/flags";
import type { QuizResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const W = 1200;
const H = 630;
const SERIF = '"Playfair Display Variable", serif';
const SANS = '"Instrument Sans Variable", sans-serif';
const MONO = '"JetBrains Mono Variable", monospace';

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

async function drawCard(canvas: HTMLCanvasElement, r: QuizResult, siteHost: string) {
  await Promise.all([
    document.fonts.load(`600 64px ${SERIF}`),
    document.fonts.load(`400 20px ${SANS}`),
    document.fonts.load(`700 16px ${MONO}`),
  ]).catch(() => undefined);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // backdrop
  ctx.fillStyle = "#0B0C0E";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(240, 0, 0, 240, 0, 700);
  glow.addColorStop(0, "rgba(212,175,55,0.14)");
  glow.addColorStop(1, "rgba(212,175,55,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // film perforations
  ctx.fillStyle = "#1A1E24";
  for (let x = 24; x < W; x += 44) {
    ctx.fillRect(x, 14, 22, 12);
    ctx.fillRect(x, H - 26, 22, 12);
  }
  ctx.strokeStyle = "#22262B";
  ctx.strokeRect(40, 44, W - 80, H - 88);

  // header
  ctx.fillStyle = "#D4AF37";
  ctx.font = `700 15px ${MONO}`;
  spaced(ctx, "FAUNAFLAG · CLASSIFICATION REPORT", 80, 100, 3);
  ctx.fillStyle = "#9BA1A6";
  ctx.font = `400 15px ${MONO}`;
  ctx.textAlign = "left";
  spaced(ctx, `${r.total} FILMS RATED`, 900, 100, 2);

  // headline
  ctx.fillStyle = "#EDEDED";
  ctx.font = `500 40px ${SERIF}`;
  ctx.fillText("I'm a", 80, 172);
  ctx.fillStyle = "#D4AF37";
  let size = 64;
  ctx.font = `600 ${size}px ${SERIF}`;
  while (ctx.measureText(r.tolerance_label).width > 640 && size > 36) {
    size -= 2;
    ctx.font = `600 ${size}px ${SERIF}`;
  }
  ctx.fillText(r.tolerance_label + ".", 80, 245);

  // bars
  let y = 310;
  for (const f of FLAGS) {
    const m = FLAG_META[f];
    ctx.fillStyle = m.hex;
    ctx.font = `700 15px ${MONO}`;
    spaced(ctx, m.short.toUpperCase(), 80, y, 2.5);
    ctx.fillStyle = "#EDEDED";
    ctx.font = `500 15px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(`${r.percentages[f]}%`, 700, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#1F242C";
    ctx.beginPath();
    ctx.roundRect(80, y + 14, 620, 10, 5);
    ctx.fill();
    ctx.fillStyle = m.hex;
    ctx.beginPath();
    ctx.roundRect(80, y + 14, Math.max(6, (620 * r.percentages[f]) / 100), 10, 5);
    ctx.fill();
    // community marker
    ctx.fillStyle = "#EDEDED";
    ctx.fillRect(80 + (620 * r.community_avg[f]) / 100 - 1, y + 8, 2, 22);
    y += 66;
  }
  ctx.fillStyle = "#6B7280";
  ctx.font = `400 13px ${SANS}`;
  ctx.fillText("│ white marker = community average", 80, y - 16);

  // donut
  const cx = 945;
  const cy = 300;
  const total = r.counts.red + r.counts.amber + r.counts.green || 1;
  let a = -Math.PI / 2;
  ctx.lineWidth = 34;
  for (const f of FLAGS) {
    const sweep = (r.counts[f] / total) * Math.PI * 2;
    if (sweep > 0) {
      ctx.strokeStyle = FLAG_META[f].hex;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, a + 0.02, a + sweep - 0.02);
      ctx.stroke();
    }
    a += sweep;
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#3DD68C";
  ctx.font = `600 60px ${SERIF}`;
  ctx.fillText(`${Math.round(r.percentages.green)}%`, cx, cy + 14);
  ctx.fillStyle = "#9BA1A6";
  ctx.font = `700 13px ${MONO}`;
  ctx.fillText("RATED SAFE", cx, cy + 44);

  // stats
  const stats: [string, string][] = [
    [`${r.agreement_pct}%`, "agree with curated flags"],
    [`${r.strictness_percentile}%`, "of viewers are less strict"],
  ];
  stats.forEach(([v, l], i) => {
    const sx = 870 + i * 0 - 0;
    const sy = 480 + i * 52;
    ctx.textAlign = "left";
    ctx.fillStyle = "#EDEDED";
    ctx.font = `600 30px ${SERIF}`;
    ctx.fillText(v, sx - 70, sy);
    ctx.fillStyle = "#9BA1A6";
    ctx.font = `400 15px ${SANS}`;
    ctx.fillText(l, sx + 40, sy - 4);
  });

  // footer
  ctx.textAlign = "left";
  ctx.fillStyle = "#EDEDED";
  ctx.font = `500 20px ${SANS}`;
  ctx.fillText("Where do you draw the line on animal cruelty in film?", 80, 548);
  ctx.fillStyle = "#D4AF37";
  ctx.font = `500 15px ${MONO}`;
  ctx.fillText(`Take the test → ${siteHost}`, 80, 576);
}

export default function ShareCard({ result }: { result: QuizResult }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState<string | null>(null);

  const shareUrl = `${window.location.origin}/results/${result.id}`;
  const text = `I'm a "${result.tolerance_label}". I rated ${result.percentages.green}% of animal films as safe on the FaunaFlag animal cruelty film test. Where do you draw the line?`;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // canvas mounts with the dialog; wait a frame for it
    const t = requestAnimationFrame(async () => {
      const c = canvasRef.current;
      if (!c) return;
      await drawCard(c, result, window.location.host);
      if (!cancelled) setImg(c.toDataURL("image/png"));
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(t);
    };
  }, [open, result]);

  const blob = async () => {
    const res = await fetch(img!);
    return res.blob();
  };

  const download = () => {
    if (!img) return;
    const a = document.createElement("a");
    a.href = img;
    a.download = `faunaflag-${result.tolerance_label.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const nativeShare = async () => {
    if (!img) return;
    try {
      const file = new File([await blob()], "faunaflag-result.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: shareUrl, title: "My FaunaFlag verdict" });
      } else if (navigator.share) {
        await navigator.share({ text, url: shareUrl, title: "My FaunaFlag verdict" });
      } else {
        download();
        toast.info("Sharing isn't supported in this browser, so the image was downloaded instead.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) toast.error("Couldn't open sharing");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const social = "font-mono text-[11px] uppercase tracking-[0.15em]";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setImg(null); }}>
      <DialogTrigger render={<Button data-testid="results-share-button" className={social} />}>
        <Share2 className="size-4" /> Share my verdict
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Share your verdict</DialogTitle>
        </DialogHeader>
        <canvas ref={canvasRef} className="hidden" />
        <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-sm border border-border bg-background">
          {img ? (
            <img src={img} alt="Your FaunaFlag result card" className="h-full w-full animate-reel-in" data-testid="share-card-image" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download} disabled={!img} data-testid="share-download-button" className={social}><Download className="size-4" /> Download image</Button>
          {canNativeShare && (
            <Button variant="outline" onClick={nativeShare} disabled={!img} data-testid="share-native-button" className={social}><Share2 className="size-4" /> Share…</Button>
          )}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="share-x-link"
            className={cn(buttonVariants({ variant: "outline" }), social)}
          >
            <SiX size={14} /> Post on X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="share-facebook-link"
            className={cn(buttonVariants({ variant: "outline" }), social)}
          >
            <SiFacebook size={14} /> Facebook
          </a>
          <Button variant="ghost" onClick={copyLink} data-testid="share-copy-link-button" className={social}><Copy className="size-4" /> Copy link</Button>
        </div>
        <p className="text-xs text-muted-foreground">For Instagram or TikTok, download the image and attach it to your post.</p>
      </DialogContent>
    </Dialog>
  );
}
