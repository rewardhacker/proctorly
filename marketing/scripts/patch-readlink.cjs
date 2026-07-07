// ponytail: exFAT on E: returns EISDIR instead of EINVAL for readlink on
// non-symlink files. Patch callback, sync, and promises variants so all
// Next.js worker processes behave correctly (collect-build-traces uses
// fs/promises.readlink). Loaded via NODE_OPTIONS=--require in the build script.
const fs = require("fs");

const _readlink = fs.readlink.bind(fs);
fs.readlink = function readlink(path, options, callback) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "function" ? undefined : options;
  _readlink(path, opts, (err, linkString) => {
    if (err && err.code === "EISDIR") {
      const e = Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path: String(path) }
      );
      cb(e, "");
    } else {
      cb(err, linkString);
    }
  });
};

const _readlinkSync = fs.readlinkSync.bind(fs);
fs.readlinkSync = function readlinkSync(path, options) {
  try {
    return _readlinkSync(path, options);
  } catch (err) {
    if (err && err.code === "EISDIR") {
      const e = Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path: String(path) }
      );
      throw e;
    }
    throw err;
  }
};

// collect-build-traces.js uses fs/promises.readlink
const _readlinkPromise = fs.promises.readlink.bind(fs.promises);
fs.promises.readlink = async function readlink(path, options) {
  try {
    return await _readlinkPromise(path, options);
  } catch (err) {
    if (err && err.code === "EISDIR") {
      const e = Object.assign(
        new Error(`EINVAL: invalid argument, readlink '${path}'`),
        { code: "EINVAL", syscall: "readlink", path: String(path) }
      );
      throw e;
    }
    throw err;
  }
};
