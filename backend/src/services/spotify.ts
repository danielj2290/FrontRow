// ======================
// Spotify Web API client
// ======================
// Spotify gives us artist metadata: photos, genres, popularity score.
// This is what makes artist pages feel like a music product.
//
// Auth model: the most involved of our three APIs — OAuth 2.0
// "Client Credentials" flow:
//   1. POST our client_id + secret to Spotify's token endpoint
//   2. Get back a short-lived access token (~1 hour)
//   3. Send that token as a Bearer header on every API call
//
// WHY this flow: we're only reading public catalog data (no user playlists),
// so we authenticate as an APP, not as a user. No login redirect needed.
// Docs: https://developer.spotify.com/documentation/web-api

import { requireEnv } from "../config/env.js";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const BASE_URL = "https://api.spotify.com/v1";

// NOTE (verified 2026-07): Spotify apps created after Nov 2024 in
// "development mode" no longer receive genres, popularity, or followers —
// only basic fields (id, name, images, urls). We keep those fields in the
// type as optional-with-defaults in case Spotify grants them on extended
// access, but DO NOT depend on them. Genre data for browse pages should
// come from SeatGeek's performer genres instead.
export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[]; // usually [] — see note above
  popularity: number | null; // 0–100 when present, null otherwise
  images: { url: string; width: number; height: number }[]; // ← the field we actually need
  followers: { total: number | null };
}

// Cache the token in memory so repeated calls within the hour reuse it
// instead of hitting the token endpoint every time.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  // Credentials go in a Basic auth header: base64("client_id:client_secret")
  const credentials = Buffer.from(
    `${requireEnv("SPOTIFY_CLIENT_ID")}:${requireEnv("SPOTIFY_CLIENT_SECRET")}`
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  // Refresh 60s early so we never send an about-to-expire token
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

/**
 * Search for an artist by name and return the best match.
 * Maps to the Week 1 checklist item: "artist images, genre, popularity".
 */
export async function searchArtist(name: string): Promise<SpotifyArtist | null> {
  const token = await getAccessToken();

  const params = new URLSearchParams({ q: name, type: "artist", limit: "1" });
  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify search error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { artists: { items: SpotifyArtist[] } };
  const artist = data.artists.items[0];
  if (!artist) return null;

  // Normalize missing fields (see note on SpotifyArtist above) so every
  // caller can rely on the shape instead of re-checking for undefined.
  return {
    ...artist,
    genres: artist.genres ?? [],
    popularity: artist.popularity ?? null,
    images: artist.images ?? [],
    followers: artist.followers ?? { total: null },
  };
}
