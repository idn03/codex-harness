import { readdir } from "node:fs/promises";

export const nextCheckpointName = async (dir: string): Promise<string> => {
  const existing = await readdir(dir).catch(() => [] as string[]);
  const numbers = existing
    .filter((f) => /^\d{3}\.json$/.test(f))
    .map((f) => parseInt(f.slice(0, 3), 10));
  const next = (numbers.length === 0 ? 0 : Math.max(...numbers)) + 1;
  return `${String(next).padStart(3, "0")}.json`;
};
