export type Reader = (path: string) => string | null;

export const parse = <T>(read: Reader, path: string): T | null => {
  const text = read(path);

  if (text === null) {
    return null;
  }

  return JSON.parse(text) as T;
};
