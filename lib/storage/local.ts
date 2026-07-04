import fs from "fs/promises";
import path from "path";
import { StorageAdapter } from "./types";

const ROOT = path.join(process.cwd(), "uploads");

export const localStorage: StorageAdapter = {
  async put(key, data) {
    const filePath = path.join(ROOT, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  },
  async read(key) {
    return fs.readFile(path.join(ROOT, key));
  },
  async delete(key) {
    await fs.rm(path.join(ROOT, key), { force: true });
  },
};
