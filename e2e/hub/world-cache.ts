export interface CachedWorld {
  readonly state: string;
  readonly photos: ReadonlyMap<number, Buffer>;
}

export interface WorldCache {
  rememberState(port: number, state: string): void;
  rememberPhoto(port: number, photo: number, bytes: Buffer): void;
  stateOf(port: number): string | undefined;
  photoOf(port: number, photo: number): Buffer | undefined;
  ports(): readonly number[];
}

export const createWorldCache = (): WorldCache => {
  const states = new Map<number, string>();
  const photos = new Map<string, Buffer>();

  const key = (port: number, photo: number): string => `${String(port)}/${String(photo)}`;

  return {
    rememberState: (port, state) => {
      states.set(port, state);
    },

    rememberPhoto: (port, photo, bytes) => {
      photos.set(key(port, photo), bytes);
    },

    stateOf: (port) => states.get(port),

    photoOf: (port, photo) => photos.get(key(port, photo)),

    ports: () => [...states.keys()].sort((first, second) => first - second),
  };
};
