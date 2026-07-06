import type { NextConfig } from "next";
import fs from "fs";

// ponytail: exFAT on E: returns EISDIR instead of EINVAL when readlink is
// called on a non-symlink file. Patch both the async and sync variants so
// Next.js's RSC plugin and webpack treat non-symlinks correctly at build time.
const _readlink = fs.readlink.bind(fs) as typeof fs.readlink;
(fs as unknown as Record<string, unknown>).readlink = function readlink(
  path: fs.PathLike,
  options: unknown,
  callback?: (err: NodeJS.ErrnoException | null, linkString: string) => void,
) {
  const cb = typeof options === "function" ? options : callback!;
  const opts = typeof options === "function" ? undefined : options;
  (_readlink as Function)(path, opts, (err: NodeJS.ErrnoException | null, linkString: string) => {
    if (err?.code === "EISDIR") {
      const e = Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path: String(path) },
      );
      cb(e as NodeJS.ErrnoException, "");
    } else {
      cb(err, linkString);
    }
  });
} as typeof fs.readlink;

const _readlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = function readlinkSync(path: fs.PathLike, options?: unknown) {
  try {
    return (_readlinkSync as Function)(path, options);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EISDIR") {
      const ne = Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path: String(path) },
      );
      throw ne;
    }
    throw e;
  }
} as typeof fs.readlinkSync;

const _readlinkPromise = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async function readlink(path: fs.PathLike, options?: unknown) {
  try {
    return await (_readlinkPromise as Function)(path, options);
  } catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EISDIR") {
      throw Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path: String(path) },
      );
    }
    throw e;
  }
} as typeof fs.promises.readlink;

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
