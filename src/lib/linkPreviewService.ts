export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  hostname: string;
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

const previewCache = new Map<string, LinkPreview>();

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function getFaviconUrl(hostname: string): string {
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
}

export function truncateUrl(url: string, maxLength = 50): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength) + "...";
}

export async function getLinkPreview(url: string): Promise<LinkPreview | null> {
  if (previewCache.has(url)) {
    return previewCache.get(url)!;
  }

  try {
    const hostname = getHostname(url);
    const preview: LinkPreview = {
      url,
      title: hostname,
      hostname,
    };
    previewCache.set(url, preview);
    return preview;
  } catch {
    return null;
  }
}
