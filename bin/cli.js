#!/usr/bin/env node
const { runCli } = require("../src/tools/cli");

runCli().catch((err) => {
  const message = err && err.message ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
