const localUrl = "http://localhost:3000";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return new URL(localUrl);

  try {
    const url = new URL(configured);
    return new URL(url.origin);
  } catch {
    return new URL(localUrl);
  }
}

export function absoluteSiteUrl(path = "/") {
  return new URL(path, getSiteUrl()).toString();
}
