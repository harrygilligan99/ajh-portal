import { brandingSchema, type Branding } from "@ajh/config";
import type { Json } from "@ajh/db";

const FALLBACK: Branding = { logo_url: null, primary_color: "#0f172a" };

export function brandingFromClient(client: { branding: Json }): Branding {
  const parsed = brandingSchema.safeParse(client.branding);
  return parsed.success ? parsed.data : FALLBACK;
}

/**
 * "#rrggbb" → "h s% l%" for the shadcn --primary CSS variable, so the client's
 * brand colour becomes the portal accent. Returns null for invalid input.
 */
export function hexToHslVar(hex: string): string | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1]!, 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${h.toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

/** Readable text colour (as an HSL var value) for on-brand buttons. */
export function contrastForegroundVar(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return "0 0% 98%";
  const int = parseInt(match[1]!, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "240 10% 3.9%" : "0 0% 98%";
}
