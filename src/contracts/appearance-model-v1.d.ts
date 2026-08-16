export type HomeStyle =
  | 'classic' | 'nature' | 'bloom' | 'portals'
  | 'bento' | 'studio' | 'paper' | 'glass';

export const HOME_LAYOUT_IDS: readonly HomeStyle[];
export const LEGACY_HOME_LAYOUT_ALIASES: Readonly<Record<string, HomeStyle>>;
export const APPEARANCE_SETTING_OWNERSHIP: Readonly<{
  theme: readonly string[];
  homepage: readonly string[];
}>;
export function normalizeHomeStyle(value: unknown, fallback?: HomeStyle | ''): HomeStyle | '';
export function extractHomeStyle(raw: unknown): HomeStyle | null;
export function preserveHomeLayoutForThemeChange(
  raw: unknown,
  currentHomeStyle: unknown
): { changed: boolean; homeStyle: HomeStyle; value: unknown };
export function selectTheme<T extends Record<string, unknown>>(
  state: T, themeId: unknown
): T & { themeId: string };
export function selectHomeLayout<T extends Record<string, unknown>>(
  state: T, homeStyle: unknown
): T & { homeStyle: HomeStyle };
