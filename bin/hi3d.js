#!/usr/bin/env node

import { UsageError, main } from "../src/cli.js";

main().catch((err) => {
  if (err instanceof UsageError) {
    console.error(err.message);
    process.exit(2);
  }
  console.error(err.stack || err.message || err);
  process.exit(1);
});
