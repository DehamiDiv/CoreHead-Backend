export type ClassifiedLayoutKind = "single-post" | "blog-archive" | "home-page" | null;
export type ClassifiedTemplateOrigin = "manual" | "ai" | "imported" | "migrated";

export function templateTypeToKind(type?: string): ClassifiedLayoutKind;
export function layoutKindFromTemplate(template: unknown): ClassifiedLayoutKind;
export function isPublishedTemplate(template: unknown): boolean;
export function templateOrigin(template: unknown): ClassifiedTemplateOrigin;
