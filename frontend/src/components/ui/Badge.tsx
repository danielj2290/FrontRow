import type { ReactNode } from "react";

// Small inline labels: genres, dates, statuses. Later this is also where the
// Week 7 recommendation pills (BUY NOW / WAIT) and confidence levels live.
export type BadgeVariant = "default" | "accent" | "outline" | "positive" | "negative";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-surface text-fg-muted border border-line",
  // Tinted rather than solid: a badge is a label, not a call to action, so it
  // should not carry the same visual weight as a primary button.
  accent: "bg-accent-dim text-accent-hover border border-accent/40",
  outline: "border border-line text-fg-muted",
  positive: "bg-surface text-positive border border-positive/30",
  negative: "bg-surface text-negative border border-negative/30",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
