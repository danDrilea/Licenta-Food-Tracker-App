// ─── Shared Utilities ───────────────────────────────────────────────

/** Get local YYYY-MM-DD date string, avoiding UTC timezone shifts */
export function getLocalDateStr(date?: Date): string {
  const d = date ?? new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

/** Capitalize each word in a food name string */
export function formatFoodName(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Clean a base URL by stripping a trailing slash */
export function cleanServerUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
