#!/usr/bin/env node
/**
 * Run the **global** ngrok binary (e.g. from Homebrew), not an npm-bundled copy.
 * Override path: NGROK_BIN=/path/to/ngrok
 */
const { spawnSync } = require("child_process");
const fs = require("fs");

function findNgrok() {
  if (process.env.NGROK_BIN) {
    if (!fs.existsSync(process.env.NGROK_BIN)) {
      console.error(`NGROK_BIN not found: ${process.env.NGROK_BIN}`);
      process.exit(1);
    }
    return process.env.NGROK_BIN;
  }
  for (const p of ["/opt/homebrew/bin/ngrok", "/usr/local/bin/ngrok"]) {
    if (fs.existsSync(p)) return p;
  }
  return "ngrok";
}

let args = process.argv.slice(2);
if (args.length === 1 && args[0] === "http") {
  args = ["http", String(process.env.PORT || 3000)];
}

const ngrok = findNgrok();
const r = spawnSync(ngrok, args, { stdio: "inherit" });
process.exit(r.status === null ? 1 : r.status);
