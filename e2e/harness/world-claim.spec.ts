import { beforeEach, describe, expect, it } from "vitest";
import { claimWorld, forgetClaims } from "./world-claim.ts";


const A_PORT = 8090;

const ANOTHER_PORT = 8091;

const host: Record<PropertyKey, unknown> = {};

describe("claimWorld()", () => {
  beforeEach(() => {
    forgetClaims(host);
  });

  it("should let a worker claim its port", () => {
    expect(() => claimWorld(A_PORT, host)).not.toThrow();
  });

  it("should let two workers claim two ports", () => {
    claimWorld(A_PORT, host);

    expect(() => claimWorld(ANOTHER_PORT, host)).not.toThrow();
  });

  it("should refuse a second world on a port already claimed", () => {
    claimWorld(A_PORT, host);

    expect(() => claimWorld(A_PORT, host)).toThrow(/isolate/);
  });

  it("should name the port, so the message points at a world rather than a worker", () => {
    claimWorld(A_PORT, host);

    expect(() => claimWorld(A_PORT, host)).toThrow(String(A_PORT));
  });

  it("should keep its claims on the host it was given, not on the module", () => {
    const elsewhere: Record<PropertyKey, unknown> = {};
    claimWorld(A_PORT, host);

    expect(() => claimWorld(A_PORT, elsewhere)).not.toThrow();
  });
});
