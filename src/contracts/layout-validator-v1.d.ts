import type { LayoutDocumentV1 } from "../corehead-frontend/frontend/lib/layoutContract";

export interface LayoutValidationIssue {
  code: string;
  path: string;
  message: string;
  blockId?: string;
}

export interface LayoutValidationResult {
  valid: boolean;
  errors: LayoutValidationIssue[];
  warnings: LayoutValidationIssue[];
}

export function validateLayoutDocumentV1(
  input: unknown,
  options?: { semantic?: boolean },
): LayoutValidationResult;

export function assertValidLayoutDocumentV1(
  input: unknown,
  options?: { semantic?: boolean },
): LayoutValidationResult;

export const BLOCK_TYPES: readonly string[];
export const BINDING_PATHS: readonly string[];
export const STYLE_PROPERTIES: readonly string[];
