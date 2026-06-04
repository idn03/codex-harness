import { readdir } from "node:fs/promises";
import { harnessPaths } from "./harness-paths.js";

export interface StatusData {
  active: string[];
  intake: string[];
}

export const gatherStatus = async (root: string): Promise<StatusData> => {
  const paths = harnessPaths(root);
  const active = await readdir(paths.active).catch(() => [] as string[]);
  const intake = await readdir(paths.intake).catch(() => [] as string[]);
  return {
    active: active.filter((f) => f !== ".gitkeep"),
    intake: intake.filter((f) => f !== ".gitkeep"),
  };
};
