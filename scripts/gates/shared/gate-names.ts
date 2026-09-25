export const GATE = {
  lint: "lint",
  typecheck: "typecheck",
  e2eTypecheck: "e2e:typecheck",
  checkDocs: "check-docs",
  test: "test",
  coverage: "test:coverage",
  harness: "test:e2e-harness",
  e2e: "e2e",
  e2eChanged: "e2e:changed",
  mutationChanged: "test:mutation-changed",
  mutation: "test:mutation",
} as const;

export type Gate = (typeof GATE)[keyof typeof GATE];

export const BATTERY = {
  quick: "check:quick",
  push: "check:push",
  phase: "check:phase",
  release: "check:release",
} as const;

export type Battery = (typeof BATTERY)[keyof typeof BATTERY];

export const LOCK = {
  e2eWorlds: "e2e-worlds",
  battery: "battery",
} as const;

export type Lock = (typeof LOCK)[keyof typeof LOCK];
