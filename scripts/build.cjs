// ponytail: wrapper so NODE_OPTIONS is set before spawning next build,
// making the readlink patch inherited by all worker processes on Windows/exFAT.
const { spawnSync } = require("child_process");
const path = require("path");

const isWin = process.platform === "win32";
const nextBin = isWin ? "node_modules\\.bin\\next.cmd" : "node_modules/.bin/next";

const result = spawnSync(
  isWin ? nextBin : process.execPath,
  isWin ? ["build", "--webpack"] : [nextBin, "build", "--webpack"],
  {
    shell: isWin,
    env: {
      ...process.env,
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        `--require ${path.resolve(__dirname, "patch-readlink.cjs")}`,
      ]
        .filter(Boolean)
        .join(" "),
    },
    stdio: "inherit",
  }
);

process.exit(result.status ?? 1);
