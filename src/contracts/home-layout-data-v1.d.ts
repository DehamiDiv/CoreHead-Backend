export function normalizeHomeLayoutData<T extends Record<string, unknown>>(
  input: T | null | undefined
): T & {
  siteName: string;
  siteSlug: string;
  eyebrow: string;
  tagline: string;
  heroImage: unknown | null;
  posts: unknown[];
};
