/**
 * Canonical app URL for links in emails, Stripe redirects, etc.
 * On Vercel, falls back to VERCEL_URL when NEXTAUTH_URL isn't set.
 */
export function getAppBaseUrl() {
  if (process.env.NEXTAUTH_URL?.trim()) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function appUrl(path = "") {
  const base = getAppBaseUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
