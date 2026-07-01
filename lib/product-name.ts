// Derive a clean product name from its URL for the map header. No AI, no guess
// beyond the domain: "https://www.getlago.com/pricing" → "Getlago". Good enough
// to title the map; the gray summary underneath carries the real description.

export function productNameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    // Take the main label (drop the TLD and any subdomain like app./go.).
    const parts = host.split(".").filter(Boolean);
    const label =
      parts.length >= 2 ? parts[parts.length - 2] : parts[0] || host;
    if (!label) return url;
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return url;
  }
}
