// server/src/utils/fsx.js
import { promises as fsp } from "fs";
import path from "path";

export async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

export function join(...args) {
  return path.join(...args);
}
