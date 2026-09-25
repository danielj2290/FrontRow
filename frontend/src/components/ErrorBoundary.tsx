import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/Button.tsx";

/**
 * Catches render errors so one broken component does not white-screen the app.
 *
 * WHY THIS IS A CLASS: error boundaries are the one thing React still has no
 * hook for. componentDidCatch and getDerivedStateFromError only exist on class
 * components, so this file is the single deliberate exception to the rest of
 * the codebase being function components.
 *
 * What it does NOT catch, so you are not surprised later:
 *   - errors inside event handlers (those need try/catch)
 *   - errors in async code that has already escaped the render
 *   - errors during server rendering
 * It covers the render path, which is where an undefined field takes the
 * entire page down.
 */
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console for now. When there is real traffic this is where an error
    // reporting service would receive it.
    console.error("Render error caught by boundary:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Something broke
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-fg">
          This page failed to load
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          A bug on our side, not something you did. Reloading usually fixes it.
        </p>

        {/* The message helps when Dan is the one hitting it; it is short
            enough not to be alarming to anyone else. */}
        <p className="mt-6 border border-line bg-surface px-4 py-3 text-left font-mono text-xs text-fg-subtle">
          {this.state.error.message}
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          {/* A full navigation, not a router link: the router's state is part
              of what may be broken, so we want a clean boot. */}
          <Button variant="secondary" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }
}
