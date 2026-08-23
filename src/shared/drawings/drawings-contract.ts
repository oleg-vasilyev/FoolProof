export interface Drawing {
  readonly file: string;
  readonly asks: string;
  readonly svg: string;
}

export interface CommandLineTool {
  readonly does: string;
  readonly usage: string;
  say(args: readonly string[]): readonly string[];
}

export interface FeatureDrawings {
  readonly mockups: () => readonly Drawing[];
  readonly sitePosters: () => readonly Drawing[];
  readonly gallery: () => readonly Drawing[];
  readonly tools: Readonly<Record<string, CommandLineTool>>;
}
