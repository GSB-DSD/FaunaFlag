import type { Flag } from "@/lib/types";

export const FLAGS: Flag[] = ["red", "amber", "green"];

export const FLAG_META: Record<
  Flag,
  { label: string; short: string; hex: string; definition: string; key: string; badge: string; button: string }
> = {
  red: {
    label: "Red Flag",
    short: "Red",
    hex: "#E5484D",
    key: "R",
    definition: "Real harm, cruelty, or exploitation of animals. Unacceptable.",
    badge: "bg-flag-red-bg text-flag-red-soft border-flag-red/60",
    button:
      "border-flag-red/50 bg-flag-red-bg/60 text-flag-red-soft hover:bg-flag-red-bg hover:border-flag-red data-[active=true]:bg-flag-red data-[active=true]:text-white data-[active=true]:border-flag-red",
  },
  amber: {
    label: "Amber Flag",
    short: "Amber",
    hex: "#F5A623",
    key: "A",
    definition: "A grey area: distressing themes, simulated peril, or questionable handling.",
    badge: "bg-flag-amber-bg text-flag-amber-soft border-flag-amber/60",
    button:
      "border-flag-amber/50 bg-flag-amber-bg/60 text-flag-amber-soft hover:bg-flag-amber-bg hover:border-flag-amber data-[active=true]:bg-flag-amber data-[active=true]:text-[#0B0C0E] data-[active=true]:border-flag-amber",
  },
  green: {
    label: "Green Flag",
    short: "Green",
    hex: "#30A46C",
    key: "G",
    definition: "Safe: humane, supervised, CGI or animated, with no distress to animals.",
    badge: "bg-flag-green-bg text-flag-green-soft border-flag-green/60",
    button:
      "border-flag-green/50 bg-flag-green-bg/60 text-flag-green-soft hover:bg-flag-green-bg hover:border-flag-green data-[active=true]:bg-flag-green data-[active=true]:text-[#0B0C0E] data-[active=true]:border-flag-green",
  },
};

export const LAST_RESULT_KEY = "faunaflag:last-result";
