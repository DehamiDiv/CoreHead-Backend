import type { LayoutDocumentV1, LayoutKind, LayoutOrigin } from "../corehead-frontend/frontend/lib/layoutContract";
import type { LayoutValidationIssue } from "./layout-validator-v1";

export function prepareRenderableLayout(input: unknown, options?: {
  name?: string;
  kind?: LayoutKind;
  origin?: LayoutOrigin;
  designStyle?: string;
  semantic?: boolean;
}): {
  document: LayoutDocumentV1;
  valid: boolean;
  sourceFormat: string;
  issues: LayoutValidationIssue[];
};
