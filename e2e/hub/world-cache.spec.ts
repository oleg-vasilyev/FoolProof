import { beforeEach, describe, expect, it } from "vitest";
import { createWorldCache, type WorldCache } from "./world-cache.ts";


const A_PORT = 8090;

const ANOTHER_PORT = 8091;

const A_PHOTO = 1;

const ANOTHER_PHOTO = 2;

const STATE = '{"messages":[]}';

const LATER_STATE = '{"messages":[1]}';

let cache: WorldCache;

beforeEach(() => {
  cache = createWorldCache();
});

describe("remembering a world's state", () => {
  it("should give back what it was told", () => {
    cache.rememberState(A_PORT, STATE);

    expect(cache.stateOf(A_PORT)).toBe(STATE);
  });

  it("should know nothing about a port it never saw", () => {
    expect(cache.stateOf(A_PORT)).toBeUndefined();
  });

  it("should keep the newest state, since the older one is spent", () => {
    cache.rememberState(A_PORT, STATE);
    cache.rememberState(A_PORT, LATER_STATE);

    expect(cache.stateOf(A_PORT)).toBe(LATER_STATE);
  });

  it("should keep two worlds apart", () => {
    cache.rememberState(A_PORT, STATE);
    cache.rememberState(ANOTHER_PORT, LATER_STATE);

    expect(cache.stateOf(A_PORT)).toBe(STATE);
    expect(cache.stateOf(ANOTHER_PORT)).toBe(LATER_STATE);
  });
});

describe("remembering the pictures a world drew", () => {
  it("should give back the bytes it was told", () => {
    const bytes = Buffer.from("a scoresheet");
    cache.rememberPhoto(A_PORT, A_PHOTO, bytes);

    expect(cache.photoOf(A_PORT, A_PHOTO)).toBe(bytes);
  });

  it("should keep two pictures of one world apart", () => {
    cache.rememberPhoto(A_PORT, A_PHOTO, Buffer.from("first"));
    cache.rememberPhoto(A_PORT, ANOTHER_PHOTO, Buffer.from("second"));

    expect(cache.photoOf(A_PORT, A_PHOTO)?.toString()).toBe("first");
    expect(cache.photoOf(A_PORT, ANOTHER_PHOTO)?.toString()).toBe("second");
  });

  it("should not confuse one world's picture with another's under the same id", () => {
    cache.rememberPhoto(A_PORT, A_PHOTO, Buffer.from("mine"));
    cache.rememberPhoto(ANOTHER_PORT, A_PHOTO, Buffer.from("theirs"));

    expect(cache.photoOf(A_PORT, A_PHOTO)?.toString()).toBe("mine");
  });

  it("should know nothing about a picture it never saw", () => {
    expect(cache.photoOf(A_PORT, A_PHOTO)).toBeUndefined();
  });
});

describe("ports()", () => {
  it("should list only the worlds it has state for", () => {
    cache.rememberState(ANOTHER_PORT, STATE);

    expect(cache.ports()).toEqual([ANOTHER_PORT]);
  });

  it("should list them in port order, whatever order they arrived in", () => {
    cache.rememberState(ANOTHER_PORT, STATE);
    cache.rememberState(A_PORT, STATE);

    expect(cache.ports()).toEqual([A_PORT, ANOTHER_PORT]);
  });

  it("should not list a world known only by a picture", () => {
    cache.rememberPhoto(A_PORT, A_PHOTO, Buffer.from("a scoresheet"));

    expect(cache.ports()).toEqual([]);
  });

  it("should list nothing before anything has been seen", () => {
    expect(cache.ports()).toEqual([]);
  });
});
