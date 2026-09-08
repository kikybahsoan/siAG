/**
 * Resolves static asset paths taking into account Vite base URL (e.g. GitHub Pages subpaths like /siAG/).
 */
export function resolveAssetUrl(path?: string): string {
  if (!path) return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  
  // Data URLs, Blobs, or external HTTP/HTTPS links
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  const clean = trimmed.replace(/^\.\//, "").replace(/^\//, "");
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL || "./";
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
}
