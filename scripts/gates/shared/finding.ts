export interface Finding {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly rule: string;
  readonly message: string;
}

export const MOST_FINDINGS = 30;
