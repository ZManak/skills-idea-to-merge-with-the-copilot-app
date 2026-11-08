export interface Bookmark {
  url: string;
  slug: string;
}

export const STORAGE_KEY = 'mona-bookmarks';
export const BOOKMARK_SEPARATOR = ' :: ';

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Enter a URL to save.');

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new Error('Enter a valid web address, such as example.com.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Enter an HTTP or HTTPS address without credentials.');
  }

  // Keep the familiar origin-only representation without URL's trailing slash.
  return url.pathname === '/' && !url.search && !url.hash
    ? url.origin
    : url.href;
}

export function parseBookmarks(raw: string | null): Bookmark[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.url !== 'string' || !/^https?:\/\//i.test(candidate.url) ||
        typeof candidate.slug !== 'string' ||
        !/^mona-[a-zA-Z0-9]+$/.test(candidate.slug)) return [];
    try {
      const url = normalizeUrl(candidate.url);
      return [{ url, slug: candidate.slug }];
    } catch {
      return [];
    }
  });
}

export function formatBookmark(bookmark: Bookmark): string {
  return `${bookmark.url}${BOOKMARK_SEPARATOR}${bookmark.slug}`;
}

export function generateSlug(existing: Bookmark[]): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const used = new Set(existing.map((bookmark) => bookmark.slug));
  let slug: string;
  do {
    let suffix = '';
    while (suffix.length < 6) {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      for (const byte of bytes) {
        if (byte < 248) suffix += alphabet[byte % alphabet.length];
        if (suffix.length === 6) break;
      }
    }
    slug = `mona-${suffix}`;
  } while (used.has(slug));
  return slug;
}
