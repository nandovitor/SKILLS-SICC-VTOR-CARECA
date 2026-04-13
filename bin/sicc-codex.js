#!/usr/bin/env node

const { runCli } = require("../src/cli");

runCli().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
