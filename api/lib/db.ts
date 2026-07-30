import { sql } from "@vercel/postgres";

export { sql };

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

/**
 * @vercel/postgres's sql tagged template only accepts primitive params, so
 * text[] values must be passed in as a Postgres array literal string and
 * cast explicitly (e.g. `${toPgTextArray(ids)}::text[]`) rather than as a
 * raw JS array.
 */
export function toPgTextArray(values: string[]): string {
  const escaped = values.map((v) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}
