import { describe, expect, it } from "vitest";
import {
  databaseForWorker,
  FIRST_WORLD_PORT,
  MOST_WORLDS,
  portForWorker,
  worldPorts,
} from "./world-ports.ts";


const FIRST = "0";

const SECOND = "1";

const LAST = String(MOST_WORLDS - 1);

const ONE_PAST_THE_LAST = String(MOST_WORLDS);

describe("portForWorker()", () => {
  it("should give the first worker the first port", () => {
    expect(portForWorker(FIRST)).toBe(FIRST_WORLD_PORT);
  });

  it("should give each worker a port of its own", () => {
    expect(portForWorker(SECOND)).toBe(portForWorker(FIRST) + 1);
  });

  it("should fill the window right to its last port", () => {
    expect(portForWorker(LAST)).toBe(FIRST_WORLD_PORT + MOST_WORLDS - 1);
  });

  it("should refuse a worker the hub would never look for", () => {
    expect(() => portForWorker(ONE_PAST_THE_LAST)).toThrow(/outside/);
  });

  it("should refuse a negative worker rather than reach below the window", () => {
    expect(() => portForWorker("-1")).toThrow(/outside/);
  });

  it("should refuse an id that is not a number at all", () => {
    expect(() => portForWorker("second")).toThrow(/outside/);
  });

  it("should fall back to the first port when nothing names a worker", () => {
    expect(portForWorker(undefined)).toBe(FIRST_WORLD_PORT);
  });
});

describe("worldPorts()", () => {
  it("should list exactly the window the hub sweeps", () => {
    expect(worldPorts()).toHaveLength(MOST_WORLDS);
    expect(worldPorts()[0]).toBe(FIRST_WORLD_PORT);
    expect(worldPorts().at(-1)).toBe(FIRST_WORLD_PORT + MOST_WORLDS - 1);
  });

  it("should cover every port a worker can be given", () => {
    const reachable = Array.from({ length: MOST_WORLDS }, (_, at) => portForWorker(String(at)));

    expect(worldPorts()).toEqual(reachable);
  });
});

describe("databaseForWorker()", () => {
  it("should give each worker a scratch file of its own", () => {
    expect(databaseForWorker(FIRST)).not.toBe(databaseForWorker(SECOND));
  });

  it("should name a file the scratch sweeper will recognise", () => {
    expect(databaseForWorker(FIRST)).toMatch(/^data\/foolproof\.e2e-.+\.db$/);
  });
});
