import type { HomeStyle } from './appearance-model-v1.js';

export interface ThemeRegistration {
  id: string;
  name: string;
  colours: Record<'primary' | 'background' | 'foreground' | 'accent' | 'card' | 'cardForeground' | 'muted', string>;
  header: { headerBg: string; headerFont: string; ctaBg: string; ctaColor: string; ctaText: string };
  footer: { footerBg: string; footerFont: string; footerDescription: string };
  font: string;
  tokens: {
    radius: string;
    shadow: string;
    buttonStyle: 'pill' | 'square';
    containerWidth: string;
    sectionSpacing: string;
    headerVariant: 'light' | 'dark';
    footerVariant: 'solid';
  };
  recommendedHomeStyle: HomeStyle;
  homeStyle: HomeStyle;
}

export interface HomeLayoutRegistration {
  id: HomeStyle;
  name: string;
  description: string;
  suitableFor: readonly string[];
  renderer: string;
  previewAsset: string;
  defaultContentKey: string;
  recommendedThemeIds: readonly string[];
}

export const THEME_REGISTRY: Readonly<Record<string, ThemeRegistration>>;
export const THEME_PREVIEW_ASSETS: Readonly<Record<string, string>>;
export const HOME_LAYOUT_REGISTRY: Readonly<Record<HomeStyle, HomeLayoutRegistration>>;
export function getThemeRegistration(themeId?: unknown): ThemeRegistration;
export function getHomeLayoutRegistration(homeStyle?: unknown): HomeLayoutRegistration;
export function validateAppearanceRegistry(): { valid: boolean; errors: string[] };
