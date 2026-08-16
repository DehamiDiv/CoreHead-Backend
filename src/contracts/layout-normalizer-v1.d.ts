import type { LayoutDocumentV1, LayoutKind, LayoutOrigin } from "../corehead-frontend/frontend/lib/layoutContract";
import type { LayoutValidationIssue } from "./layout-validator-v1";

export interface LayoutNormalizationResult {
  document: LayoutDocumentV1;
  warnings: LayoutValidationIssue[];
  sourceFormat: "layout-document-v1" | "block-array" | "blocks-object" | "legacy-sections" | "ai-history";
}

export function normalizeLayoutDocumentV1(
  input: unknown,
  options?: {
    name?: string;
    kind?: LayoutKind | string;
    origin?: LayoutOrigin;
    description?: string;
    designStyle?: string;
  },
): LayoutNormalizationResult;

export function bindingFromPlaceholder(value: unknown): string | null;
