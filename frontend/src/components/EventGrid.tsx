import type { ReactNode } from "react";

// One column on a phone, two from 640px, three from 1024px.
export function EventGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
