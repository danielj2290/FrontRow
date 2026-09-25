// Style maps live apart from the components that use them so Button.tsx only
// exports components — otherwise React Fast Refresh silently stops working for
// that file, and every edit becomes a full page reload during development.

// Every button in the app is one of these three. Adding a fourth variant
// should feel like a decision, not a reflex — that is how a palette stays
// coherent once several people (or one person on several days) touch it.
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  // Solid royal purple. One primary action per screen, at most.
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  // Outlined. The default for anything that is not THE action.
  secondary: "border border-line bg-surface text-fg hover:bg-surface-hover hover:border-accent",
  // No chrome until hovered. For tertiary actions that should not compete.
  ghost: "text-fg-muted hover:bg-surface-hover hover:text-fg",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  // md is ~44px tall at this padding — the minimum comfortable touch target on
  // a phone, which is the width we design for first.
  md: "px-5 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wide " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-40";

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  return [BASE, VARIANTS[variant], SIZES[size], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}
