// SeatGeek returns datetime_local with no timezone suffix ("2026-09-05T19:00:00").
// That is deliberate on their end — it is the local time AT THE VENUE. new Date()
// parses an unsuffixed string as local time, which is the behaviour we want:
// a show at 7pm in Glendale should read "7:00 PM" no matter where the visitor is.

export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date TBA";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventTime(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatPrice(price: number | null): string | null {
  if (price === null) return null;
  return `$${Math.round(price)}`;
}

// "State Farm Stadium · Glendale, AZ" — state is optional on international venues.
export function formatVenue(venue: { name: string; city: string; state: string | null }): string {
  const location = venue.state ? `${venue.city}, ${venue.state}` : venue.city;
  return `${venue.name} · ${location}`;
}
