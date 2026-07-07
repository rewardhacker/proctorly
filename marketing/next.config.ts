import type { NextConfig } from "next";
import fs from "fs";

// ponytail: exFAT EISDIR→EINVAL patch (same as main app)
const _readlink = fs.readlink.bind(fs) as typeof fs.readlink;
(fs as unknown as Record<string, unknown>).readlink = function readlink(
  path: fs.PathLike, options: unknown,
  callback?: (err: NodeJS.ErrnoException | null, linkString: string) => void,
) {
  const cb = typeof options === "function" ? options : callback!;
  const opts = typeof options === "function" ? undefined : options;
  (_readlink as Function)(path, opts, (err: NodeJS.ErrnoException | null, linkString: string) => {
    if (err?.code === "EISDIR") {
      cb(Object.assign(new Error(`EINVAL: invalid argument, readlink '${path}'`), { code: "EINVAL", syscall: "readlink", path: String(path) }) as NodeJS.ErrnoException, "");
    } else { cb(err, linkString); }
  });
} as typeof fs.readlink;

const _readlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = function readlinkSync(path: fs.PathLike, options?: unknown) {
  try { return (_readlinkSync as Function)(path, options); }
  catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EISDIR") throw Object.assign(new Error(`EINVAL: invalid argument, readlink '${path}'`), { code: "EINVAL", syscall: "readlink", path: String(path) });
    throw e;
  }
} as typeof fs.readlinkSync;

const _readlinkPromise = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async function readlink(path: fs.PathLike, options?: unknown) {
  try { return await (_readlinkPromise as Function)(path, options); }
  catch (err: unknown) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EISDIR") throw Object.assign(new Error(`EINVAL: invalid argument, readlink '${path}'`), { code: "EINVAL", syscall: "readlink", path: String(path) });
    throw e;
  }
} as typeof fs.promises.readlink;

const nextConfig: NextConfig = {
  output: "export",
  // ponytail: GitHub Pages serves from /proctorly/ subpath
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  webpack(config) {
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
