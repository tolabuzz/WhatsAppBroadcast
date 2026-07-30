import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "info" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-black/5 text-ink-muted",
  success: "bg-brand-pale text-brand-dark",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-sky-100 text-sky-700",
  danger: "bg-red-100 text-red-700",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
